
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  CalendarDays,
  Clock,
  CheckCircle2,
  Circle,
  Loader2,
  X,
  ListTodo,
  AlertCircle,
  Pencil,
  Save,
  UserRound,
} from "lucide-react";

interface Task {
  id: string;
  lead_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: string | null;
  status: string | null;
  assigned_to: string | null;
  created_at: string;
}

interface TeamMember {
  id: string;
  email: string;
  role: string;
}

interface Props {
  leadId: string;
}

export default function LeadTasks({ leadId }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Create task state
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [assignedTo, setAssignedTo] = useState("");

  // Edit task state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editPriority, setEditPriority] = useState("Medium");
  const [editAssignedTo, setEditAssignedTo] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // Load tasks
  const loadTasks = useCallback(async () => {
    try {
      setError("");

      const response = await fetch(`/api/leads/${leadId}/tasks`, {
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
  }, [leadId]);

  // Load active workspace members
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
    } catch (err) {
      console.error("Load team members error:", err);
    }
  }, []);

  useEffect(() => {
    loadTasks();
    loadTeamMembers();
  }, [loadTasks, loadTeamMembers]);

  // Create task
  async function createTask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!title.trim()) return;

    try {
      setSaving(true);
      setError("");

      const response = await fetch(`/api/leads/${leadId}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          due_date: dueDate
            ? new Date(dueDate).toISOString()
            : null,
          priority,
          assigned_to: assignedTo || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to create task");
      }

      setTasks((previous) => [...previous, result.task]);

      setTitle("");
      setDescription("");
      setDueDate("");
      setPriority("Medium");
      setAssignedTo("");
      setShowForm(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create task"
      );
    } finally {
      setSaving(false);
    }
  }

  // Mark task completed or pending
  async function toggleTask(task: Task) {
    const nextStatus =
      task.status === "Completed" ? "Pending" : "Completed";

    try {
      setError("");

      const response = await fetch(
        `/api/leads/${leadId}/tasks/${task.id}`,
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
          item.id === task.id ? result.task : item
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update task"
      );
    }
  }

  // Open edit form with existing task details
  function startEditing(task: Task) {
    setEditingTaskId(task.id);
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

  // Cancel editing
  function cancelEditing() {
    setEditingTaskId(null);
    setEditTitle("");
    setEditDescription("");
    setEditDueDate("");
    setEditPriority("Medium");
    setEditAssignedTo("");
  }

  // Save edited task
  async function saveTask(task: Task) {
    if (!editTitle.trim()) {
      setError("Task title is required");
      return;
    }

    try {
      setEditSaving(true);
      setError("");

      const response = await fetch(
        `/api/leads/${leadId}/tasks/${task.id}`,
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
          item.id === task.id ? result.task : item
        )
      );

      cancelEditing();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update task"
      );
    } finally {
      setEditSaving(false);
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

  function isOverdue(task: Task) {
    return (
      task.status !== "Completed" &&
      !!task.due_date &&
      new Date(task.due_date).getTime() < Date.now()
    );
  }

  function getMemberEmail(userId: string | null) {
    if (!userId) return null;

    return members.find((member) => member.id === userId)?.email || null;
  }

  const pendingCount = tasks.filter(
    (task) => task.status !== "Completed"
  ).length;

  const completedCount = tasks.length - pendingCount;

  // Reusable assignment dropdown
  function AssignmentDropdown({
    value,
    onChange,
  }: {
    value: string;
    onChange: (value: string) => void;
  }) {
    return (
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-600">
          Assign To
        </label>

        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl bg-white px-3 py-3 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-[#5149E8]"
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
            No active team members found.
          </p>
        )}
      </div>
    );
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-[0_3px_16px_rgba(32,35,74,0.045)] sm:p-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <ListTodo size={20} className="text-[#5149E8]" />

            <h2 className="text-lg font-bold text-[#20234A]">
              Follow-up Tasks
            </h2>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Manage reminders and follow-ups for this lead.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#5149E8] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#433BD0]"
        >
          {showForm ? <X size={17} /> : <Plus size={17} />}
          {showForm ? "Close" : "Add Task"}
        </button>
      </div>

      {/* Summary */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-[#F0EEFF] p-4">
          <p className="text-xs font-semibold text-slate-500">
            Pending
          </p>

          <p className="mt-1 text-2xl font-bold text-[#5149E8]">
            {pendingCount}
          </p>
        </div>

        <div className="rounded-xl bg-[#EAF8F6] p-4">
          <p className="text-xs font-semibold text-slate-500">
            Completed
          </p>

          <p className="mt-1 text-2xl font-bold text-[#20AAA6]">
            {completedCount}
          </p>
        </div>
      </div>

      {/* Create Task Form */}
      {showForm && (
        <form
          onSubmit={createTask}
          className="mt-5 space-y-4 rounded-xl bg-[#F8F8FD] p-4"
        >
          <h3 className="font-bold text-[#20234A]">
            Create Follow-up Task
          </h3>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-600">
              Task Title *
            </label>

            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g. Call customer for quotation"
              className="w-full rounded-xl bg-white px-4 py-3 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-[#5149E8]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-600">
              Description
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add task details..."
              rows={3}
              className="w-full rounded-xl bg-white px-4 py-3 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-[#5149E8]"
            />
          </div>

          <AssignmentDropdown
            value={assignedTo}
            onChange={setAssignedTo}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-600">
                Due Date & Time
              </label>

              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl bg-white px-3 py-3 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-[#5149E8]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-600">
                Priority
              </label>

              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-xl bg-white px-3 py-3 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-[#5149E8]"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-white"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#5149E8] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {saving && (
                <Loader2 size={16} className="animate-spin" />
              )}
              Create Task
            </button>
          </div>
        </form>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-600">
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Task List */}
      <div className="mt-6 space-y-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2
              size={24}
              className="animate-spin text-[#5149E8]"
            />
          </div>
        ) : tasks.length === 0 ? (
          <div className="rounded-xl bg-[#F8F8FD] px-4 py-10 text-center">
            <CalendarDays
              size={28}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 font-semibold text-[#20234A]">
              No follow-up tasks yet
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Create a task to schedule your next interaction.
            </p>
          </div>
        ) : (
          tasks.map((task) => {
            const overdue = isOverdue(task);
            const completed = task.status === "Completed";
            const isEditing = editingTaskId === task.id;
            const assignedEmail = getMemberEmail(task.assigned_to);

            return (
              <div
                key={task.id}
                className={`rounded-xl border p-4 transition ${
                  completed
                    ? "border-slate-100 bg-slate-50"
                    : overdue
                    ? "border-red-100 bg-red-50/40"
                    : "border-slate-100 bg-white"
                }`}
              >
                {isEditing ? (
                  /* Edit Task Form */
                  <div className="w-full space-y-3">
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-600">
                        Task Title *
                      </label>

                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Task title"
                        className="w-full rounded-xl bg-white px-4 py-3 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-[#5149E8]"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-600">
                        Description
                      </label>

                      <textarea
                        value={editDescription}
                        onChange={(e) =>
                          setEditDescription(e.target.value)
                        }
                        placeholder="Description"
                        rows={3}
                        className="w-full rounded-xl bg-white px-4 py-3 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-[#5149E8]"
                      />
                    </div>

                    <AssignmentDropdown
                      value={editAssignedTo}
                      onChange={setEditAssignedTo}
                    />

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-slate-600">
                          Due Date & Time
                        </label>

                        <input
                          type="datetime-local"
                          value={editDueDate}
                          onChange={(e) =>
                            setEditDueDate(e.target.value)
                          }
                          className="w-full rounded-xl bg-white px-3 py-3 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-[#5149E8]"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-slate-600">
                          Priority
                        </label>

                        <select
                          value={editPriority}
                          onChange={(e) =>
                            setEditPriority(e.target.value)
                          }
                          className="w-full rounded-xl bg-white px-3 py-3 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-[#5149E8]"
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={cancelEditing}
                        disabled={editSaving}
                        className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-white disabled:opacity-50"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={() => saveTask(task)}
                        disabled={editSaving || !editTitle.trim()}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#5149E8] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                      >
                        {editSaving ? (
                          <Loader2
                            size={15}
                            className="animate-spin"
                          />
                        ) : (
                          <Save size={15} />
                        )}

                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Normal Task Display */
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => toggleTask(task)}
                      title={
                        completed ? "Mark pending" : "Mark completed"
                      }
                      className="mt-0.5 shrink-0"
                    >
                      {completed ? (
                        <CheckCircle2
                          size={21}
                          className="text-[#20AAA6]"
                        />
                      ) : (
                        <Circle
                          size={21}
                          className="text-slate-300 hover:text-[#5149E8]"
                        />
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
                          {task.priority || "Medium"}
                        </span>
                      </div>

                      {task.description && (
                        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-500">
                          {task.description}
                        </p>
                      )}

                      {/* Assigned Member */}
                      <div className="mt-2">
                        {task.assigned_to ? (
                          <div className="inline-flex items-center gap-2 rounded-lg bg-[#F0EEFF] px-3 py-1.5 text-xs font-semibold text-[#5149E8]">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#5149E8] text-[10px] text-white">
                              {assignedEmail?.charAt(0).toUpperCase() || "U"}
                            </span>

                            {assignedEmail || "Assigned member"}
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                            <UserRound size={13} />
                            Unassigned
                          </div>
                        )}
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                        <span
                          className={`inline-flex items-center gap-1.5 ${
                            overdue
                              ? "font-bold text-red-600"
                              : "text-slate-400"
                          }`}
                        >
                          {overdue ? (
                            <AlertCircle size={14} />
                          ) : (
                            <Clock size={14} />
                          )}

                          {overdue ? "Overdue · " : ""}
                          {formatDate(task.due_date)}
                        </span>

                        {completed && (
                          <span className="font-semibold text-[#20AAA6]">
                            Completed
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => startEditing(task)}
                      title="Edit task"
                      className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-[#F0EEFF] hover:text-[#5149E8]"
                    >
                      <Pencil size={16} />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Refresh */}
      <button
        type="button"
        onClick={loadTasks}
        disabled={loading}
        className="mt-4 text-xs font-semibold text-[#5149E8] hover:underline disabled:opacity-50"
      >
        Refresh tasks
      </button>
    </section>
  );
}
