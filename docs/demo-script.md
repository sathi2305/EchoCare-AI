# EchoCare AI — 3-Minute Hackathon Demo Script
### Amazon Developer Hackathon 2026

**Target Video Duration:** 2 minutes 50 seconds  
**Speaker:** Sarah (Demonstrator)

---

### [0:00 - 0:25] Introduction & The Problem
> "Hi everyone, I'm excited to present **EchoCare AI — Proactive Agentic Home Care Coordinator**. 
> Managing daily care for elderly family members or patients at home is overwhelming. Families juggle medication times, vitals checks, physical therapy, and caregiver shifts across scattered messages and paper notes. Important routines get missed, and caregiver shift transitions lack clear records.
> EchoCare AI solves this with a proactive, agentic care coordinator that doesn't just answer questions—it takes authorized actions, schedules reminders, compiles factual shift handovers, and runs verified MCP tools."

---

### [0:25 - 0:50] The Dashboard & Overview
> "Here is our dashboard, designed for clarity with a futuristic deep navy aesthetic inspired by clinical monitoring interfaces.
> We see Eleanor Vance, our 78-year-old care recipient with hypertension and Type 2 diabetes. 
> The dashboard displays live metrics: 5 out of 8 tasks completed today—an adherence rate of 63%. 
> Here's our care timeline showing hourly routines, active home reminders with melodic chimes, and our care team on duty."

---

### [0:50 - 1:25] Proactive AI Assistant & Tool Execution
> "Let's open the **AI Assistant** workspace. Notice our animated AI orb indicating agent readiness.
> I can interact via text or voice in English or Tamil. Let's ask:
> *'What care tasks are due today?'*
> Watch the agent execute the `list_care_tasks()` tool. It queries our actual backend database and reports the truth: evening medication at 7:30 PM and humidifier preparation at 9:00 PM are pending.
> Now let's ask it to schedule an action:
> *'Create a reminder for physical therapy at 4 PM.'*
> The agent executes `create_reminder()`, creates an active audio chime, and updates Eleanor's schedule in real time."

---

### [1:25 - 1:55] Consequential Safeguards & Auditable History
> "Safety is critical in healthcare. What happens if someone asks to cancel a critical medication?
> Let's test: *'Cancel task for evening medication.'*
> EchoCare AI does NOT silently delete it. Instead, it triggers an **Approval Card**:
> *'Cancelling a care task requires explicit caregiver authorization.'*
> The caregiver must confirm with clinical justification before any write takes effect.
> Everything is permanently logged in our **Activity History** audit trail, showing timestamps, actors, and tools."

---

### [1:55 - 2:20] Automated Caregiver Shift Handover
> "At 3:00 PM, when Nurse David finishes his shift and passes responsibility to Sarah, they need a handover report.
> Rather than writing notes from memory, they click **'Compile Shift Handover'**.
> EchoCare AI scans all recorded tasks, blood pressure logs, and glucose readings, truthfully compiling:
> 1. Clinical vitals (Glucose 112 mg/dL, BP 124/76 mmHg)
> 2. Completed activities
> 3. Actionable pending items for the evening
> Caregivers can print it or export it to PDF with one click."

---

### [2:20 - 2:45] Model Context Protocol (MCP) Integration
> "EchoCare AI is built for interoperability. Under our **MCP Inspector**, judges can see our active Model Context Protocol server.
> We expose standard JSON-RPC tools like `get_daily_summary`, `create_care_task`, and `generate_handover`. 
> Reviewers can test any tool and inspect the live JSON-RPC envelope directly."

---

### [2:45 - 3:00] Conclusion & Next Steps
> "EchoCare AI is a complete, working full-stack coordinator combining proactive agentic workflows, voice accessibility, auditable safety, and open standards. 
> Thank you for reviewing EchoCare AI!"
