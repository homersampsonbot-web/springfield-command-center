"use client";

import { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const COLUMNS = [
  "QUEUED",
  "IN_PROGRESS",
  "BLOCKED",
  "QA",
  "DONE",
];

export default function KanbanPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/kanban");
      const data = await res.json();
      setJobs(data);
    } catch (e) {
      console.error("Failed to fetch jobs", e);
    } finally {
      setLoading(false);
    }
  };

  const onDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId;
    
    // Update local state first (optimistic)
    const updatedJobs = jobs.map((job) =>
      job.id === draggableId ? { ...job, status: newStatus } : job
    );
    setJobs(updatedJobs);

    try {
      await fetch("/api/kanban", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: draggableId, status: newStatus }),
      });
    } catch (e) {
      console.error("Failed to update status", e);
      fetchJobs(); // Revert on error
    }
  };

  if (loading) return <div className="p-8 text-yellow-500">Loading Kanban...</div>;

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-8">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
        <span>🏗️</span> Springfield Mission Control: Kanban
      </h1>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <div key={col} className="bg-slate-800 rounded-lg p-4 min-w-[300px] flex-shrink-0">
              <h2 className="text-sm font-bold text-slate-400 mb-4 tracking-wider uppercase flex justify-between">
                {col}
                <span className="bg-slate-700 px-2 py-0.5 rounded text-xs">
                  {jobs.filter((j) => j.status === col).length}
                </span>
              </h2>
              <Droppable droppableId={col}>
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="min-h-[500px] flex flex-col gap-3"
                  >
                    {jobs
                      .filter((j) => j.status === col)
                      .map((job, index) => (
                        <Draggable key={job.id} draggableId={job.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="bg-slate-700 border border-slate-600 rounded p-4 hover:border-yellow-500/50 transition-colors shadow-lg"
                            >
                              <div className="text-xs font-mono text-slate-400 mb-1 flex justify-between">
                                <span>{job.owner}</span>
                                {job.risk === "HIGH" && <span className="text-red-400">!! HIGH RISK</span>}
                              </div>
                              <h3 className="font-semibold text-slate-100 leading-snug">
                                {job.title}
                              </h3>
                              {job.labels && job.labels.length > 0 && (
                                <div className="flex gap-1 mt-2 flex-wrap">
                                  {job.labels.map((l: string) => (
                                    <span key={l} className="bg-slate-600 text-[10px] px-1.5 py-0.5 rounded text-slate-300">
                                      {l}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </main>
  );
}
