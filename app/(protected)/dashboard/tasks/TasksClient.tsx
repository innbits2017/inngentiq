
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  RefreshCw,
  ExternalLink,
  Search,
  ListTodo,
  Pencil,
  X,
  Save,
  Loader2,
  UserRound,
  Users,
  UserCheck,
  UserX,
} from "lucide-react";

type Lead = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
};

type TeamMember = {
  id: string;
  email: string;
  role: string;
};

type Task = {
  id: string;
  lead_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: string | null;
  status: string | null;
  assigned_to: string | null;
  created_at: string;
  lead: Lead | Lead[] | null;
};

type Filter =
  | "All"
  | "Pending"
  | "Completed"
  | "Overdue"
  | "Today"
  | "Upcoming";

type AssignmentFilter =
  | "All"
  | "My Tasks"
  | "Team Tasks"
  | "Unassigned";

export default function TasksClient() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [filter, setFilter] = useState<Filter>("All");
  const [assignmentFilter, setAssignmentFilter] =
    useState<AssignmentFilter>("All");
  const [search, setSearch] = useState("");

  // Edit modal state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editPriority, setEditPriority] = useState("Medium");
  const [editAssignedTo, setEditAssignedTo] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // Load tasks
  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/tasks", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to load tasks");
      }

      setTasks(result.tasks || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load tasks"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Load workspace members and current user
  const loadTeamMembers = useCallback(async () => {
    try {
      const response = await fetch("/api/team-members", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to load team members"
        );
      }

      setMembers(result.members || []);
      setCurrentUserId(result.currentUserId || "");
    } catch (err) {
      console.error("Load team members error:", err);
    }
  }, []);

  useEffect(() => {
    loadTasks();
    loadTeamMembers();
  }, [loadTasks, loadTeamMembers]);

  const getLead = (task: Task): Lead | null => {
    if (Array.isArray(task.lead)) {
      return task.lead[0] || null;
    }

    return task.lead;
  };

  const getMember = (userId: string | null) => {
    if (!userId) return null;

    return members.find((member) => member.id === userId) || null;
  };

  const isOverdue = (task: Task) => {
    return (
      task.status !== "Completed" &&
      !!task.due_date &&
      new Date(task.due_date).getTime() < Date.now()
    );
  };

  const isToday = (task: Task) => {
    if (!task.due_date) return false;

    const due = new Date(task.due_date);
    const today = new Date();

    return (
      due.getDate() === today.getDate() &&
      due.getMonth() === today.getMonth() &&
      due.getFullYear() === today.getFullYear()
    );
  };

  const isUpcoming = (task: Task) => {
    if (!task.due_date || task.status === "Completed") return false;

    const due = new Date(task.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    return due > new Date() && due <= nextWeek;
  };

  const pendingCount = tasks.filter(
    (task) => task.status !== "Completed"
  ).length;

  const completedCount = tasks.filter(
    (task) => task.status === "Completed"
  ).length;

  const overdueCount = tasks.filter(isOverdue).length;

  const todayCount = tasks.filter(
    (task) => task.status !== "Completed" && isToday(task)
  ).length;

  const myTasksCount = tasks.filter(
    (task) => task.assigned_to === currentUserId && !!currentUserId
  ).length;

  const teamTasksCount = tasks.filter(
    (task) =>
      !!task.assigned_to &&
      !!currentUserId &&
      task.assigned_to !== currentUserId
  ).length;

  const unassignedCount = tasks.filter(
    (task) => !task.assigned_to
  ).length;

  // Apply status, assignment and search filters
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const lead = getLead(task);

      let matchesFilter = true;

      switch (filter) {
        case "Pending":
          matchesFilter = task.status !== "Completed";
          break;
        case "Completed":
          matchesFilter = task.status === "Completed";
          break;
        case "Overdue":
          matchesFilter = isOverdue(task);
          break;
        case "Today":
          matchesFilter =
            task.status !== "Completed" && isToday(task);
          break;
        case "Upcoming":
          matchesFilter = isUpcoming(task);
          break;
        default:
          matchesFilter = true;
      }

      let matchesAssignment = true;

      switch (assignmentFilter) {
        case "My Tasks":
          matchesAssignment =
            !!currentUserId && task.assigned_to === currentUserId;
          break;

        case "Team Tasks":
          matchesAssignment =
            !!task.assigned_to &&
            !!currentUserId &&
            task.assigned_to !== currentUserId;
          break;

        case "Unassigned":
          matchesAssignment = !task.assigned_to;
          break;

        default:
          matchesAssignment = true;
      }

      const searchText = search.toLowerCase();

      const assignedMember = getMember(task.assigned_to);

      const matchesSearch =
        !searchText ||
        task.title.toLowerCase().includes(searchText) ||
        (lead?.name || "").toLowerCase().includes(searchText) ||
        (lead?.email || "").toLowerCase().includes(searchText) ||
        (lead?.company || "").toLowerCase().includes(searchText) ||
        (assignedMember?.email || "").toLowerCase().includes(searchText);

      return matchesFilter && matchesAssignment && matchesSearch;
    });
  }, [tasks, filter, assignmentFilter, search, members, currentUserId]);

  // Open edit modal
  function openEditModal(task: Task) {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || "");
    setEditPriority(task.priority || "Medium");
    setEditAssignedTo(task.assigned_to || "");

    if (task.due_date) {
      const date = new Date(task.due_date);

      const localDate = new Date(
        date.getTime() - date.getTimezoneOffset() * 60000
      );

      setEditDueDate(localDate.toISOString().slice(0, 16));
    } else {
      setEditDueDate("");
    }

    setError("");
  }

  function closeEditModal() {
    if (editSaving) return;

    setEditingTask(null);
    setEditTitle("");
    setEditDescription("");
    setEditDueDate("");
    setEditPriority("Medium");
    setEditAssignedTo("");
  }

  // Save edited task
  async function saveTask() {
    if (!editingTask || !editTitle.trim()) {
      setError("Task title is required");
      return;
    }

    try {
      setEditSaving(true);
      setError("");

      const response = await fetch(
        `/api/leads/${editingTask.lead_id}/tasks/${editingTask.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: editTitle.trim(),
            description: editDescription.trim() || null,
            due_date: editDueDate
              ? new Date(editDueDate).toISOString()
              : null,
            priority: editPriority,
            assigned_to: editAssignedTo || null,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to update task");
      }

      setTasks((previous) =>
        previous.map((item) =>
          item.id === editingTask.id
            ? { ...item, ...result.task }
            : item
        )
      );

      closeEditModal();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update task"
      );
    } finally {
      setEditSaving(false);
    }
  }

  // Complete or reopen task
  async function toggleTask(task: Task) {
    const nextStatus =
      task.status === "Completed" ? "Pending" : "Completed";

    try {
      setUpdatingId(task.id);
      setError("");

      const response = await fetch(
        `/api/leads/${task.lead_id}/tasks/${task.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: nextStatus }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to update task");
      }

      setTasks((previous) =>
        previous.map((item) =>
          item.id === task.id
            ? { ...item, ...result.task }
            : item
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update task"
      );
    } finally {
      setUpdatingId(null);
    }
  }

  function formatDate(value: string | null) {
    if (!value) return "No due date";

    return new Date(value).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const filters: Filter[] = [
    "All",
    "Pending",
    "Today",
    "Upcoming",
    "Overdue",
    "Completed",
  ];

  const assignmentFilters: {
    label: AssignmentFilter;
    count: number;
    icon: React.ReactNode;
  }[] = [
    {
      label: "All",
      count: tasks.length,
      icon: <ListTodo size={15} />,
    },
    {
      label: "My Tasks",
      count: myTasksCount,
      icon: <UserCheck size={15} />,
    },
    {
      label: "Team Tasks",
      count: teamTasksCount,
      icon: <Users size={15} />,
    },
    {
      label: "Unassigned",
      count: unassignedCount,
      icon: <UserX size={15} />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare size={23} className="text-[#5149E8]" />

            <h1 className="text-2xl font-bold text-[#20234A]">
              Tasks & Follow-ups
            </h1>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Manage all your customer follow-ups in one place.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            loadTasks();
            loadTeamMembers();
          }}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#5149E8] shadow-sm transition hover:bg-[#F0EEFF] disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <SummaryCard
          label="Total Tasks"
          value={tasks.length}
          icon={<ListTodo size={20} />}
          bg="bg-[#F0EEFF]"
          color="text-[#5149E8]"
        />

        <SummaryCard
          label="Pending"
          value={pendingCount}
          icon={<Clock size={20} />}
          bg="bg-amber-50"
          color="text-amber-600"
        />

        <SummaryCard
          label="Completed"
          value={completedCount}
          icon={<CheckCircle2 size={20} />}
          bg="bg-[#EAF8F6]"
          color="text-[#20AAA6]"
        />

        <SummaryCard
          label="Overdue"
          value={overdueCount}
          icon={<AlertCircle size={20} />}
          bg="bg-red-50"
          color="text-red-500"
        />
      </div>

      {/* Assignment Overview */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          {
            label: "All Tasks",
            value: tasks.length,
            icon: <ListTodo size={18} />,
            color: "text-[#5149E8]",
            bg: "bg-[#F0EEFF]",
          },
          {
            label: "My Tasks",
            value: myTasksCount,
            icon: <UserCheck size={18} />,
            color: "text-[#20AAA6]",
            bg: "bg-[#EAF8F6]",
          },
          {
            label: "Team Tasks",
            value: teamTasksCount,
            icon: <Users size={18} />,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Unassigned",
            value: unassignedCount,
            icon: <UserX size={18} />,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl bg-white p-4 shadow-[0_3px_16px_rgba(32,35,74,0.045)]"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-500">
                {item.label}
              </span>
              <span className={`rounded-lg p-2 ${item.bg} ${item.color}`}>
                {item.icon}
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-[#20234A]">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters and Search */}
      <div className="rounded-2xl bg-white p-4 shadow-[0_3px_16px_rgba(32,35,74,0.045)]">
        <div className="flex flex-col gap-4">
          {/* Assignment filters */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
              Task Ownership
            </p>

            <div className="flex flex-wrap gap-2">
              {assignmentFilters.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setAssignmentFilter(item.label)}
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    assignmentFilter === item.label
                      ? "bg-[#5149E8] text-white"
                      : "bg-[#F8F8FD] text-slate-500 hover:bg-[#F0EEFF] hover:text-[#5149E8]"
                  }`}
                >
                  {item.icon}
                  {item.label}
                  <span className="opacity-75">{item.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Status filters */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
              Task Status
            </p>

            <div className="flex flex-wrap gap-2">
              {filters.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                    filter === item
                      ? "bg-[#5149E8] text-white"
                      : "bg-[#F8F8FD] text-slate-500 hover:bg-[#F0EEFF] hover:text-[#5149E8]"
                  }`}
                >
                  {item}

                  {item === "Today" && (
                    <span className="ml-1.5 opacity-75">
                      {todayCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search task, lead, company or assignee..."
              className="w-full rounded-xl bg-[#F8F8FD] py-3 pl-10 pr-4 text-sm outline-none ring-1 ring-transparent focus:ring-[#5149E8]"
            />
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Tasks List */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_3px_16px_rgba(32,35,74,0.045)]">
        <div className="flex items-center justify-between border-b border-[#F0EEFF] px-5 py-4">
          <div>
            <h2 className="font-bold text-[#20234A]">
              {assignmentFilter === "All"
                ? filter === "All"
                  ? "All Tasks"
                  : `${filter} Tasks`
                : `${assignmentFilter} · ${filter === "All" ? "All Statuses" : filter}`}
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              {filteredTasks.length} task(s) found
            </p>
          </div>

          <CalendarDays size={20} className="text-[#7565F5]" />
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-slate-400">
            Loading tasks...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="py-16 text-center">
            <CheckSquare
              size={34}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 font-semibold text-[#20234A]">
              No tasks found
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Try changing the filters or search.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#F4F3FF]">
            {filteredTasks.map((task) => {
              const lead = getLead(task);
              const completed = task.status === "Completed";
              const overdue = isOverdue(task);
              const assignedMember = getMember(task.assigned_to);

              return (
                <div
                  key={task.id}
                  className="flex flex-col gap-4 px-5 py-5 transition hover:bg-[#FCFBFF] sm:flex-row sm:items-center"
                >
                  <button
                    type="button"
                    onClick={() => toggleTask(task)}
                    disabled={updatingId === task.id}
                    title={completed ? "Mark pending" : "Mark completed"}
                    className="shrink-0 self-start disabled:opacity-50"
                  >
                    {completed ? (
                      <CheckCircle2
                        size={22}
                        className="text-[#20AAA6]"
                      />
                    ) : (
                      <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-slate-300 hover:border-[#5149E8]">
                        {updatingId === task.id && (
                          <span className="h-2 w-2 animate-pulse rounded-full bg-[#5149E8]" />
                        )}
                      </span>
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        className={`text-sm font-bold ${
                          completed
                            ? "text-slate-400 line-through"
                            : "text-[#20234A]"
                        }`}
                      >
                        {task.title}
                      </h3>

                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          task.priority === "High"
                            ? "bg-red-100 text-red-600"
                            : task.priority === "Low"
                            ? "bg-slate-100 text-slate-600"
                            : "bg-[#F0EEFF] text-[#5149E8]"
                        }`}
                      >
                        {task.priority || "Medium"} Priority
                      </span>

                      {overdue && (
                        <span className="rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-bold text-red-600">
                          Overdue
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className="mt-1 text-sm text-slate-500">
                        {task.description}
                      </p>
                    )}

                    {/* Task assignment */}
                    <div className="mt-2">
                      {task.assigned_to ? (
                        <span className="inline-flex items-center gap-2 rounded-lg bg-[#F0EEFF] px-3 py-1.5 text-xs font-semibold text-[#5149E8]">
                          <UserRound size={13} />
                          {assignedMember?.email || "Assigned member"}
                          {task.assigned_to === currentUserId && (
                            <span className="text-[#20AAA6]">
                              (You)
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                          <UserX size={13} />
                          Unassigned
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock size={13} />
                        {formatDate(task.due_date)}
                      </span>

                      {lead && (
                        <span>
                          Lead:{" "}
                          <span className="font-semibold text-[#5149E8]">
                            {lead.name || lead.email || "Unnamed lead"}
                          </span>
                        </span>
                      )}

                      {lead?.company && (
                        <span>{lead.company}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:shrink-0">
                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                        completed
                          ? "bg-[#EAF8F6] text-[#20AAA6]"
                          : "bg-amber-50 text-amber-600"
                      }`}
                    >
                      {completed ? "Completed" : "Pending"}
                    </span>

                    {/* Edit Task */}
                    <button
                      type="button"
                      onClick={() => openEditModal(task)}
                      title="Edit task"
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-[#F0EEFF] hover:text-[#5149E8]"
                    >
                      <Pencil size={17} />
                    </button>

                    <Link
                      href={`/dashboard/leads/${task.lead_id}`}
                      title="Open lead"
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-[#F0EEFF] hover:text-[#5149E8]"
                    >
                      <ExternalLink size={17} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Task Modal */}
      {editingTask && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#20234A]/40 p-4 backdrop-blur-[2px]"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeEditModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-task-title"
            className="my-auto w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2
                  id="edit-task-title"
                  className="text-lg font-bold text-[#20234A]"
                >
                  Edit Task
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Update task details, assignment and follow-up schedule.
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditModal}
                disabled={editSaving}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-[#F0EEFF] hover:text-[#5149E8] disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-600">
                  Task Title *
                </label>

                <input
                  autoFocus
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Enter task title"
                  className="w-full rounded-xl bg-[#F8F8FD] px-4 py-3 text-sm outline-none ring-1 ring-transparent focus:ring-2 focus:ring-[#5149E8]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-600">
                  Description
                </label>

                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Add task details..."
                  rows={3}
                  className="w-full rounded-xl bg-[#F8F8FD] px-4 py-3 text-sm outline-none ring-1 ring-transparent focus:ring-2 focus:ring-[#5149E8]"
                />
              </div>

              {/* Assign To */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-600">
                  Assign To
                </label>

                <select
                  value={editAssignedTo}
                  onChange={(e) => setEditAssignedTo(e.target.value)}
                  className="w-full rounded-xl bg-[#F8F8FD] px-4 py-3 text-sm outline-none ring-1 ring-transparent focus:ring-2 focus:ring-[#5149E8]"
                >
                  <option value="">Unassigned</option>

                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.email} ({member.role})
                    </option>
                  ))}
                </select>

                {members.length === 0 && (
                  <p className="mt-1 text-xs text-slate-400">
                    No active workspace members found.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-600">
                  Due Date & Time
                </label>

                <input
                  type="datetime-local"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="w-full rounded-xl bg-[#F8F8FD] px-4 py-3 text-sm outline-none ring-1 ring-transparent focus:ring-2 focus:ring-[#5149E8]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-600">
                  Priority
                </label>

                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value)}
                  className="w-full rounded-xl bg-[#F8F8FD] px-4 py-3 text-sm outline-none ring-1 ring-transparent focus:ring-2 focus:ring-[#5149E8]"
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeEditModal}
                disabled={editSaving}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-[#F8F8FD] disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveTask}
                disabled={editSaving || !editTitle.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-[#5149E8] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#433BD0] disabled:opacity-50"
              >
                {editSaving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}

                {editSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  bg,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  bg: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_3px_16px_rgba(32,35,74,0.045)] sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-500 sm:text-sm">
          {label}
        </p>

        <div className={`rounded-xl p-2 ${bg} ${color}`}>
          {icon}
        </div>
      </div>

      <p className="mt-3 text-2xl font-bold text-[#20234A] sm:text-3xl">
        {value}
      </p>
    </div>
  );
}
