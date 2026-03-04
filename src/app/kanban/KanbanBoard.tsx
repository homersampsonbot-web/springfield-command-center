"use client";

import React, { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AlertCircle, Clock, CheckCircle2, PlayCircle, StopCircle, Loader2 } from 'lucide-react';

const COLUMNS = [
  { id: 'QUEUED', title: 'Queued', icon: <Clock className="w-4 h-4" /> },
  { id: 'IN_PROGRESS', title: 'In Progress', icon: <PlayCircle className="w-4 h-4" /> },
  { id: 'BLOCKED', title: 'Blocked', icon: <StopCircle className="w-4 h-4 text-red-400" /> },
  { id: 'QA', title: 'QA', icon: <AlertCircle className="w-4 h-4 text-yellow-400" /> },
  { id: 'DONE', title: 'Done', icon: <CheckCircle2 className="w-4 h-4 text-green-400" /> },
];

interface Job {
  id: string;
  title: string;
  status: string;
  owner: string;
  risk: string;
  labels: string[];
}

export default function KanbanBoard() {
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
      setJobs(data);
    } catch (e) {
      console.error("Failed to fetch jobs", e);
    } finally {
      setLoading(false);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
        activationConstraint: {
            distance: 5,
        },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const jobId = active.id as string;
    const overId = over.id as string;

    // Check if we dropped over a column or another item
    let toStatus = overId;
    if (!COLUMNS.find(c => c.id === overId)) {
        const overJob = jobs.find(j => j.id === overId);
        if (overJob) toStatus = overJob.status;
    }

    const activeJob = jobs.find(j => j.id === jobId);
    if (!activeJob || activeJob.status === toStatus) return;

    // Optimistic update
    const oldJobs = [...jobs];
    setJobs(jobs.map(j => j.id === jobId ? { ...j, status: toStatus } : j));

    try {
      const res = await fetch("/api/jobs/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, toStatus }),
      });
      if (!res.ok) throw new Error("Move failed");
    } catch (e) {
      console.error(e);
      setJobs(oldJobs);
      alert("Failed to persist move. Rolling back.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 overflow-x-auto pb-6 h-full items-start">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            icon={col.icon}
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

function KanbanColumn({ id, title, icon, jobs }: { id: string, title: string, icon: React.ReactNode, jobs: Job[] }) {
  return (
    <div className="flex flex-col bg-slate-800/50 rounded-xl w-80 shrink-0 border border-slate-700/50 overflow-hidden max-h-full">
      <div className="p-4 border-bottom border-slate-700 flex items-center justify-between bg-slate-800">
        <div className="flex items-center gap-2">
            <span className="text-slate-400">{icon}</span>
            <h2 className="font-bold text-slate-200 uppercase tracking-tight text-sm">{title}</h2>
        </div>
        <span className="bg-slate-900 text-slate-400 text-xs px-2 py-0.5 rounded-full font-mono">
          {jobs.length}
        </span>
      </div>
      
      <SortableContext id={id} items={jobs.map(j => j.id)} strategy={verticalListSortingStrategy}>
        <div className="p-3 flex flex-col gap-3 overflow-y-auto min-h-[150px]">
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
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <JobCard job={job} />
    </div>
  );
}

function JobCard({ job, isDragging }: { job: Job, isDragging?: boolean }) {
  return (
    <div className={`
        bg-slate-700 border rounded-lg p-4 shadow-lg transition-all
        ${isDragging ? 'border-yellow-500 ring-2 ring-yellow-500/20 scale-105 z-50 cursor-grabbing' : 'border-slate-600 hover:border-slate-500 cursor-grab'}
    `}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
            {job.owner}
        </span>
        {job.risk === 'HIGH' && (
            <span className="text-[10px] font-bold text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">
                HIGH RISK
            </span>
        )}
      </div>
      <h3 className="text-sm font-medium text-slate-100 leading-tight mb-3">
        {job.title}
      </h3>
      {job.labels && job.labels.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {job.labels.map(label => (
            <span key={label} className="text-[9px] text-slate-300 bg-slate-600 px-1.5 py-0.5 rounded">
                {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
