
Here is a strategy for defining, distributing, and ensuring the freshness of your chat themes and questions, designed for simplicity (MVP) and effective content management.

---

# 📚 3.4 Chat Theme & Prompt Management

To ensure every **Chat Event (Segment/Juice Run)** is unique, high-value, and non-repetitive, we will introduce a **Chat Theme** layer that rotates prompts based on the **Chat Interval (Nurture Run)**.

## 1. Defining the Content Structure

The prompts will be structured into three buckets to guide the conversation from light-hearted discovery to deep connection, as outlined in your Core Features:

| Prompt Category | Purpose | Example Starter Sentence |
| :--- | :--- | :--- |
| **Warm-up Questions** (3) | Icebreakers; low-stakes common ground. | "What's a work habit you've recently picked up/ditched?" |
| **Deep Storytelling Prompts** (2) | High-value prompts designed to reveal values/styles. | "Tell me about a project where you felt truly aligned with the mission." |
| **Reflection Question** (1) | Wrap-up/forward-looking; captures a takeaway. | "What's one thing you learned about your peer that might change how you interact?" |
| **Total Prompts per Chat:** 6 | | |

## 2. Preventing Repetition: The Theme Catalog

Repetition is avoided by decoupling the users from the themes and ensuring theme rotation:

### A. Theme Catalog Creation (MVP)
Create a centralized, finite pool of 12-16 high-quality **Chat Themes** (e.g., "The Power of Alignment," "Working in Flow," "My Design Philosophy," "Handling the Hard Stuff").

### B. Theme Rotation by Interval
The most effective way to prevent repetition is to assign **one Chat Theme** to an entire **Chat Interval (Nurture Run)**.

* **Logic:** When a new **Chat Interval** (the two-week schedule) begins, the system selects one new Theme from the catalog and assigns it to **all pairings** scheduled during that interval.
* **Analytics Benefit:** This allows you to track analytics based on the *theme's performance* (e.g., "Chats using the 'Alignment' theme had 20% higher positive sentiment").

## 3. Distributing Questions for 8 Participants

If you have 8 participants, you will have $8 / 2 = 4$ unique pairings within the **Chat Interval**.

**The Distribution Strategy: Consistent Prompts, Varied Pairs**

To simplify the MVP and maximize the richness of the AI-generated insights, **all 4 pairings within the same Chat Interval should receive the exact same set of 6 prompts.**

### Why this works:

1.  **Simplicity (MVP):** You only have to fetch one set of 6 prompts per two-week interval, rather than calculating unique sets for every pair.
2.  **Comparative Analytics:** By keeping the variable (the prompts) constant, you isolate the effect of the **pairing** and the **users**. This allows the Manager Dashboard to compare sentiment and insights across the 4 pairs and say, "When discussing the 'Alignment' theme, Pair A showed much higher energy than Pair B."
3.  **Content Management:** Since your theme catalog will contain 12-16 themes, a bi-weekly schedule means it will take **24-32 weeks (6-8 months)** before a theme repeats for the entire team. This is more than enough content runway for the MVP.

## Summary: Prompt Execution Flow

| Step | Action | Responsibility |
| :--- | :--- | :--- |
| **Interval Start** | System selects one new **Chat Theme** (e.g., "Working in Flow"). | System/Admin |
| **Interval Start** | System loads the 6 pre-approved questions associated with that theme. | System/DB |
| **Chat Event (Segment)** | All 4 pairings scheduled in the interval receive the **exact same 6 questions** during their 15-minute video call. | Video Interface |
| **Post-Chat** | AI analyzes the conversation and links the results to the specific **Chat Theme** and the **Chat Interval**. | AI Pipeline |

This ensures that the prompts are structured, non-repetitive over the medium term, and distributed in the simplest, most analytically useful way for your MVP.

Would you like to drill down into the kind of **deep storytelling prompts** that would yield the best relationship intelligence data for your AI analysis?



so for the 4 unique interactions wont those participants be discussing the same question for the 4th time? they might have the same answers?




That's a very insightful question and addresses the core risk of repetition when using a shared prompt set.

No, the participants in the 4 pairings **will not** be discussing the same question for the fourth time. The key lies in the difference between **the individual** and **the theme/prompt**.

Here's why repetition for the *individual user* is avoided and why the insights will be unique across the pairings:

## 1. Non-Repetition for the Individual User

Your system works by ensuring that a user is paired with a **different peer** for every **Chat Interval** (every two weeks).

* **User A's Experience:** User A will discuss "The Power of Alignment" theme with **User B** in their first pairing. In their next pairing (two weeks later), they will be discussing the **new theme** (e.g., "Working in Flow") with **User C**.
* **The Crucial Point:** Since the entire Chat Theme rotates every two weeks, the individual user will not encounter the same set of 6 questions again until that theme comes up in the rotation—which won't happen for 6 to 8 months.

The 4 unique pairings (A+B, C+D, E+F, G+H) all occur **during the same two-week interval** and are simply discussing the same theme **at the same time**.

## 2. Uniqueness of Insights

Even if the 4 pairings (e.g., A+B, C+D, E+F, G+H) are all discussing the same prompt, their answers and the resulting AI insights will be drastically different because they involve different relationships and experiences.

| Factor | Why Insights Remain Unique |
| :--- | :--- |
| **Relationship Dynamics** | The level of **Psychological Safety** between User A and User B is unique to that pair. The AI will detect different sentiment, energy, and depth of disclosure in A+B vs. C+D. |
| **Individual Context** | When asked, "Tell me about a project where you felt truly aligned with the mission," **User A** (an Engineer) will tell a story completely different from the one told by **User C** (a Designer). The AI extracts *values* and *working styles* tied to *that specific user's story*. |
| **Cross-Functional Nature** | The benefit of your Smart Pairing Algorithm is pairing people **cross-functionally**. An Engineer and a Designer discussing alignment will yield organizational insights distinct from a PM and a Marketing Specialist discussing the same topic. |

In short, using a standardized prompt set **during one interval** is a feature, not a bug, because it isolates and highlights the unique variables that matter most to your platform: **the relationship** and **the individual context**.





and then for the second interval the paring and theme changes?





Yes, precisely. For the second Chat Interval, **both the pairing and the theme must change** to ensure freshness, maximize relationship intelligence discovery, and prevent participant fatigue or repetition.

This strategy is fundamental to the analytical power and user experience of TeamPulp.

## 🔄 Interval Transition Logic

Your system should execute two critical actions at the start of every new **Chat Interval (Nurture Run)**:

### 1. Pairing Rotation (The Who)

The **Smart Pairing Algorithm** must be run again to generate a new set of pairings for the team.

* **Goal:** Ensure users are paired with someone new in the organization, particularly focusing on the cross-functional pairing goal outlined in your PRD (e.g., pairing a Backend Dev with a Designer).
* **Preventing Repetition:** The algorithm should log past pairings and ensure it does not repeat a pair until a significant amount of time has passed (e.g., **at least six months**). This is critical for building **Relationship Density** across the entire organization, not just within small cliques.

### 2. Theme Rotation (The What)

A new **Chat Theme** must be selected from the catalog and assigned to the entire interval.

* **Goal:** Introduce new sets of prompts to explore different dimensions of working style, values, or interests.
* **Preventing Repetition:** The system must track which theme was used in the previous $\text{N}$ intervals (where $\text{N}$ is the number of themes in your catalog) to ensure that users are presented with new questions. Since you have 12-16 themes and the rotation is bi-weekly, it will take 24-32 weeks before a user sees the same theme again.

---

## 📊 Analytical Benefit

This constant rotation ensures that your **Relationship Graph** and **Culture Health** metrics are dynamic and accurate:

* **Relationship Graph:** The rotation provides fresh data points for new connections, allowing the manager dashboard to visualize the growth of the graph.
* **AI Analysis:** The change in theme/prompts helps the AI collect a broader dataset about each individual (e.g., their alignment style, then their conflict style, then their learning style), resulting in a richer, multi-faceted **Bond Card** over time.