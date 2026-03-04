"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SaveToastState } from '@/components/SaveToast';

const COLUMNS = [
  { id: 'QUEUED', title: 'Queued', color: '#4A90D9' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: '#FFD90F' },
  { id: 'BLOCKED', title: 'Blocked', color: '#FF4444' },
  { id: 'QA', title: 'QA', color: '#7ED321' },
  { id: 'DONE', title: 'Done', color: '#00B4D8' },
];

interface Job {
  id: string;
  title: string;
  status: string;
  owner: string;
  risk: string;
  labels: string[];
}

export default function KanbanBoard({ 
  onSaveStateChange 
}: { 
  onSaveStateChange?: (state: SaveToastState) => void 
}) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/jobs");
      const data = await res.json();
      setJobs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load jobs", e);
    } finally {
      setLoading(false);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeJob = jobs.find(j => j.id === activeId);
    if (!activeJob) return;

    const isOverColumn = COLUMNS.some(c => c.id === overId);
    
    if (isOverColumn) {
      if (activeJob.status !== overId) {
        setJobs(prev => prev.map(j => j.id === activeId ? { ...j, status: overId } : j));
      }
      return;
    }

    const overJob = jobs.find(j => j.id === overId);
    if (overJob && activeJob.status !== overJob.status) {
      setJobs(prev => prev.map(j => j.id === activeId ? { ...j, status: overJob.status } : j));
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const jobId = active.id as string;
    const overId = over.id as string;

    let toStatus = overId;
    if (!COLUMNS.find(c => c.id === overId)) {
      const overJob = jobs.find(j => j.id === overId);
      if (overJob) toStatus = overJob.status;
    }

    const job = jobs.find(j => j.id === jobId);
    if (!job || job.status === toStatus) return;

    const oldJobs = [...jobs];
    const newJobs = jobs.map(j => j.id === jobId ? { ...j, status: toStatus } : j);
    setJobs(newJobs);

    onSaveStateChange?.("saving");

    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: toStatus }),
      });
      
      if (!res.ok) throw new Error("Save failed");

      onSaveStateChange?.("saved");
      setTimeout(() => onSaveStateChange?.(null), 1500);
    } catch (e) {
      console.error("[Kanban Persist Error]", e);
      onSaveStateChange?.("error");
      setTimeout(() => {
        setJobs(oldJobs);
        onSaveStateChange?.(null);
      }, 2500);
    }
  };

  if (loading) return <div style={{ color: '#FFD90F', padding: 20, fontFamily: 'Permanent Marker' }}>LOADING OPS...</div>;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 20, height: '100%', alignItems: 'flex-start' }}>
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            color={col.color}
            jobs={jobs.filter((j) => j.status === col.id)}
          />
        ))}
      </div>
      <DragOverlay>
        {activeId ? (
          <JobCard job={jobs.find((j) => j.id === activeId)!} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function KanbanColumn({ id, title, color, jobs }: { id: string, title: string, color: string, jobs: Job[] }) {
  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.03)', 
      borderRadius: 12, width: 300, flexShrink: 0, border: '1px solid rgba(255,255,255,0.05)',
      maxHeight: '100%', overflow: 'hidden'
    }}>
      <div style={{ 
        padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', 
        background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' 
      }}>
        <h2 style={{ fontFamily: 'Permanent Marker', color: color, fontSize: 14, margin: 0 }}>{title}</h2>
        <span style={{ background: 'rgba(255,255,255,0.1)', color: '#aaa', fontSize: 10, padding: '2px 6px', borderRadius: 10 }}>{jobs.length}</span>
      </div>
      
      <SortableContext id={id} items={jobs.map(j => j.id)} strategy={verticalListSortingStrategy}>
        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', minHeight: 100 }}>
          {jobs.map((job) => (
            <SortableJobCard key={job.id} job={job} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

function SortableJobCard({ job }: { job: Job }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: job.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1, 
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <JobCard job={job} />
    </div>
  );
}

function JobCard({ job, isDragging }: { job: Job, isDragging?: boolean }) {
  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    border: isDragging ? '1px solid #FFD90F' : '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
    boxShadow: isDragging ? '0 8px 20px rgba(0,0,0,0.4)' : 'none',
    cursor: isDragging ? 'grabbing' : 'grab',
    transform: isDragging ? 'scale(1.02)' : 'none',
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 9, fontFamily: 'monospace', color: '#888' }}>{job.owner}</span>
        {job.risk === 'HIGH' && <span style={{ fontSize: 9, fontWeight: 'bold', color: '#FF4444' }}>! HIGH</span>}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', lineHeight: 1.4, marginBottom: 8 }}>
        {job.title}
      </div>
      {job.labels && job.labels.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {job.labels.map(l => (
            <span key={l} style={{ fontSize: 8, background: 'rgba(255,255,255,0.1)', color: '#ccc', padding: '1px 4px', borderRadius: 4 }}>{l}</span>
          ))}
        </div>
      )}
    </div>
  );
}
