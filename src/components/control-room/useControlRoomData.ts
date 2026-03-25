'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AgentState } from './animations';

export interface AgentData {
  id: 'homer' | 'marge' | 'lisa' | 'bart' | 'maggie';
  name: string;
  state: AgentState;
  lastMessage: string;
  lastActivity: string;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'offline';
  activeJobs: number;
  queuedJobs: number;
  failedJobs: number;
  relayQueueDepth: number;
}

export interface TickerEvent {
  id: string;
  type: string;
  agentId?: string;
  message: string;
  timestamp: string;
}

export interface ControlRoomData {
  agents: AgentData[];
  systemHealth: SystemHealth;
  tickerEvents: TickerEvent[];
  lastUpdated: Date | null;
  error: string | null;
}

const DEFAULT_AGENTS: AgentData[] = [
  { id: 'maggie', name: 'Maggie', state: 'idle', lastMessage: 'Orchestrator online.', lastActivity: '' },
  { id: 'homer', name: 'Homer', state: 'idle', lastMessage: 'Execution engine ready.', lastActivity: '' },
  { id: 'marge', name: 'Marge', state: 'idle', lastMessage: 'Architecture governance active.', lastActivity: '' },
  { id: 'lisa', name: 'Lisa', state: 'idle', lastMessage: 'Strategy module standing by.', lastActivity: '' },
  { id: 'bart', name: 'Bart', state: 'idle', lastMessage: 'QA relay connected.', lastActivity: '' },
];

function deriveAgentState(agentId: string, jobs: any[], messages: any[], health: any): AgentState {
  if (health?.agents?.[agentId] === false) return 'offline';
  const activeJob = jobs?.find((j: any) => j.status === 'PROCESSING' && (j.payload?.agent === agentId || j.payload?.targetAgent === agentId));
  if (activeJob) return 'active';

  const claimedJob = jobs?.find((j: any) => j.status === 'CLAIMED' && (j.payload?.agent === agentId || j.payload?.targetAgent === agentId));
  if (claimedJob) return 'thinking';

  const queuedJob = jobs?.find((j: any) => j.status === 'QUEUED' && (j.payload?.agent === agentId || j.payload?.targetAgent === agentId));
  if (queuedJob) return 'thinking';
  const recentMessage = messages?.find((m: any) => {
    const isAgent = m.agentId === agentId || m.agent?.toLowerCase() === agentId;
    const age = Date.now() - new Date(m.createdAt || m.timestamp).getTime();
    return isAgent && age < 60000;
  });
  if (recentMessage) return 'active';
  const failedJob = jobs?.find((j: any) => j.status === 'FAILED' && (j.payload?.agent === agentId || j.payload?.targetAgent === agentId) && Date.now() - new Date(j.updatedAt).getTime() < 120000);
  if (failedJob) return 'failed';
  return 'idle';
}

function extractLastMessage(agentId: string, messages: any[]): string {
  if (!messages?.length) return '';
  const msg = messages.find((m: any) => m.agentId === agentId || m.agent?.toLowerCase() === agentId);
  if (!msg) return '';
  const content = msg.content || msg.message || '';
  return content.length > 80 ? content.slice(0, 77) + '…' : content;
}

export function useControlRoomData(): ControlRoomData {
  const [data, setData] = useState<ControlRoomData>({
    agents: DEFAULT_AGENTS,
    systemHealth: { status: 'healthy', activeJobs: 0, queuedJobs: 0, failedJobs: 0, relayQueueDepth: 0 },
    tickerEvents: [],
    lastUpdated: null,
    error: null,
  });

  const mounted = useRef(true);
  const intervals = useRef<ReturnType<typeof setInterval>[]>([]);

  const fetchAll = useCallback(async () => {
    try {
      const [healthRes, messagesRes, jobsRes, eventsRes] = await Promise.allSettled([
        fetch('/api/system-health'),
        fetch('/api/thread/messages?thread=team&limit=50'),
        fetch('/api/jobs?limit=20'),
        fetch('/api/maggie/events?limit=30'),
      ]);

      if (!mounted.current) return;

      const health = healthRes.status === 'fulfilled' && healthRes.value.ok ? await healthRes.value.json() : null;
      const messagesData = messagesRes.status === 'fulfilled' && messagesRes.value.ok ? await messagesRes.value.json() : null;
      const jobsData = jobsRes.status === 'fulfilled' && jobsRes.value.ok ? await jobsRes.value.json() : null;
      const eventsData = eventsRes.status === 'fulfilled' && eventsRes.value.ok ? await eventsRes.value.json() : null;

      const messages = messagesData?.messages || messagesData || [];
      const jobs = jobsData?.jobs || jobsData || [];
      const events = eventsData?.events || eventsData || [];

      const agents: AgentData[] = DEFAULT_AGENTS.map(agent => ({
        ...agent,
        state: deriveAgentState(agent.id, jobs, messages, health),
        lastMessage: extractLastMessage(agent.id, messages) || agent.lastMessage,
      }));

      const activeJobs = jobs.filter((j: any) => j.status === 'PROCESSING').length;
      const queuedJobs = jobs.filter((j: any) => j.status === 'QUEUED').length;
      const failedJobs = jobs.filter((j: any) => j.status === 'FAILED').length;

      const tickerEvents: TickerEvent[] = events.slice(0, 30).map((e: any) => ({
        id: e.id,
        type: e.type || e.eventType || 'EVENT',
        agentId: e.agentId,
        message: e.type || e.eventType || 'SYSTEM_EVENT',
        timestamp: e.createdAt || e.timestamp,
      }));

      if (mounted.current) {
        setData({
          agents,
          systemHealth: {
            status: health?.status || 'healthy',
            activeJobs,
            queuedJobs,
            failedJobs,
            relayQueueDepth: queuedJobs,
          },
          tickerEvents,
          lastUpdated: new Date(),
          error: null,
        });
      }
    } catch (err) {
      if (mounted.current) {
        setData(prev => ({ ...prev, error: 'Comms fault — retrying' }));
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    fetchAll();
    intervals.current.push(setInterval(fetchAll, 10000));
    return () => {
      mounted.current = false;
      intervals.current.forEach(clearInterval);
      intervals.current = [];
    };
  }, [fetchAll]);

  return data;
}
