"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  defaultDropAnimationSideEffects,
  DropAnimation,
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
  { id: 'CLAIMED', title: 'Claimed', color: '#A061CF' },
  { id: 'IN_PROGRESS', title: 'Running', color: '#FFD90F' },
  { id: 'BLOCKED', title: 'Blocked', color: '#FF4444' },
  { id: 'QA', title: 'QA', color: '#7ED321' },
  { id: 'DONE', title: 'Done', color: '#00B4D8' },
  { id: 'FAILED', title: 'Failed', color: '#888' },
];

interface Job {
  id: string;
  title: string;
  status: string;
  owner: string;
  risk: string;
  labels: string[];
}

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.5',
      },
    },
  }),
};

export default function KanbanBoard({ 
  onSaveStateChange 
}: { 
  onSaveStateChange?: (state: SaveToastState) => void 
}) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

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
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setIsDragging(true);
    document.body.style.overflow = 'hidden';
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeJob = jobs.find(j => j.id === activeId);
    if (!activeJob) return;

    // Determine if over column or card
    const isOverColumn = COLUMNS.some(c => c.id === overId);
    let overStatus = isOverColumn ? overId : jobs.find(j => j.id === overId)?.status;
    
    if (overStatus && activeJob.status !== overStatus) {
      setJobs(prev => prev.map(j => j.id === activeId ? { ...j, status: overStatus! } : j));
    }
  };

  const patchWithRetry = async (jobId: string, toStatus: string, retries = 2, delay = 250): Promise<any> => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: toStatus }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
        return patchWithRetry(jobId, toStatus, retries - 1, delay * 3);
      }
      throw e;
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setIsDragging(false);
    document.body.style.overflow = '';

    if (!over) return;

    const jobId = active.id as string;
    const overId = over.id as string;

    // Use column ID or the status of the job we are over
    let toStatus = overId;
    if (!COLUMNS.find(c => c.id === overId)) {
      const overJob = jobs.find(j => j.id === overId);
      if (overJob) toStatus = overJob.status;
    }

    const job = jobs.find(j => j.id === jobId);
    if (!job || job.status !== toStatus) {
       // already handled in onDragOver optimistically, but let's confirm logic
    }

    // Final check for state consistency
    const oldJobs = [...jobs];
    onSaveStateChange?.("saving");

    try {
      const updatedJob = await patchWithRetry(jobId, toStatus);
      console.log(`[Persisted] Job ${jobId} -> ${toStatus}`, updatedJob);
      onSaveStateChange?.("saved");
      setTimeout(() => onSaveStateChange?.(null), 1500);
      
      // Sync with server response
      setJobs(prev => prev.map(j => j.id === updatedJob.id ? { ...j, status: updatedJob.status } : j));
    } catch (e) {
      console.error("[Persist Error]", e);
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
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div style={{ 
          display: 'flex', 
          gap: 20, 
          overflowX: 'auto', 
          paddingBottom: 20, 
          height: '100%', 
          alignItems: 'flex-start',
          touchAction: isDragging ? 'none' : 'auto'
      }}>
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            color={col.color}
            jobs={jobs.filter((j) => j.status === col.id)}
            isOver={false} // can be enhanced with useDroppable if needed
          />
        ))}
      </div>
      <DragOverlay dropAnimation={dropAnimation}>
        {activeId ? (
          <JobCard job={jobs.find((j) => j.id === activeId)!} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function KanbanColumn({ id, title, color, jobs, isOver }: { id: string, title: string, color: string, jobs: Job[], isOver: boolean }) {
  const { setNodeRef } = useSortable({ id });

  return (
    <div 
      ref={setNodeRef}
      style={{ 
        display: 'flex', flexDirection: 'column', 
        background: isOver ? 'rgba(255,217,15,0.05)' : 'rgba(255,255,255,0.03)', 
        borderRadius: 14, width: 280, flexShrink: 0, 
        border: isOver ? '1px solid rgba(255,217,15,0.3)' : '1px solid rgba(255,255,255,0.05)',
        maxHeight: '100%', overflow: 'hidden',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ 
        padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', 
        background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' 
      }}>
        <h2 style={{ fontFamily: 'Permanent Marker', color: color, fontSize: 13, margin: 0, letterSpacing: '0.05em' }}>{title}</h2>
        <span style={{ background: 'rgba(255,255,255,0.1)', color: '#aaa', fontSize: 10, padding: '2px 6px', borderRadius: 10, fontWeight: 700 }}>{jobs.length}</span>
      </div>
      
      <SortableContext id={id} items={jobs.map(j => j.id)} strategy={verticalListSortingStrategy}>
        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', minHeight: 120 }}>
          {jobs.map((job) => (
            <SortableJobCard key={job.id} job={job} />
          ))}
          {jobs.length === 0 && (
            <div style={{ border: '2px dashed rgba(255,255,255,0.03)', borderRadius: 8, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'rgba(255,255,255,0.1)' }}>
                DROP HERE
            </div>
          )}
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
    opacity: isDragging ? 0.2 : 1,
    touchAction: 'none'
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <JobCard job={job} />
    </div>
  );
}

function JobCard({ job, isDragging }: { job: Job, isDragging?: boolean }) {
  const cardStyle: React.CSSProperties = {
    background: isDragging ? 'rgba(30,30,50,0.95)' : 'rgba(255,255,255,0.05)',
    border: isDragging ? '1px solid #FFD90F' : '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 12,
    boxShadow: isDragging ? '0 10px 25px rgba(0,0,0,0.5)' : 'none',
    cursor: isDragging ? 'grabbing' : 'grab',
    transform: isDragging ? 'scale(1.03)' : 'none',
    transition: 'transform 0.1s ease',
    zIndex: isDragging ? 1000 : 1,
    position: 'relative',
  };

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'rgba(255,217,15,0.5)', fontWeight: 700 }}>{job.owner}</span>
        {job.risk === 'HIGH' && <span style={{ fontSize: 9, fontWeight: 'bold', color: '#FF4444', background: 'rgba(255,68,68,0.1)', padding: '1px 4px', borderRadius: 4 }}>HIGH RISK</span>}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', lineHeight: 1.4, marginBottom: 8, letterSpacing: '-0.01em' }}>
        {job.title}
      </div>
      {job.labels && job.labels.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {job.labels.map(l => (
            <span key={l} style={{ fontSize: 8, background: 'rgba(255,255,255,0.08)', color: '#aaa', padding: '1px 5px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{l}</span>
          ))}
        </div>
      )}
    </div>
  );
}
