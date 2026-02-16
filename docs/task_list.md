## Tasks

- [x] TASK001: determine metrics we want to track.
- [x] TASK002: Plan analytics feature (tracking, storage, display) @[context/features/analytics_dashboard.md]
- [x] TASK003: Record marker between transcription identifying the conversation for each question interval.
- [x] TASK004: Create component to list a users past connections. Place this on the dashboard page only for 'member' and 'admin' user types.
- [x] TASK005: Update dashboard page to be specific for the individual user types. e.g. 'admin', 'owner', 'member'.  If you have to just add plaeholder components for what each user could be presented.
- [x] TASK006: Update dashboard to show analytics for 'admin' users.
- [ ] TASK007: Create clear and seeding script to reset our firebase environment and populate it with a small amount of test data. This should include  clearing firestore documents, firebase auth users and creating default themes  with 20 questions for each theme.  The themes should be related team building, general knowledge that might apply across the world. Themes and questions that would porove good talking points for team members it could be sport, food, books, movies, or more aligned with industry.  The themese should follwo the existing theme structure however the accountId should remain NULL, this would allow us to know that themses themes are avaialbe to all accounts, however should not be allowed to be edited.  The should be showen in the themes page as 'System' or 'Standard' themes for use by any account.

- [ ] TASK008: Create a 'connections/<id>' page to show the deatils of their past connection. e.g. when did it happen, what questions were asked, who were the participants and a summary of the responses per question.
- [ ] TASK009: Trigger ai post-processing of each question and the conversation to calculate relationship analytics.
- [x] TASK010: Allow adding users to multiple teams.  When an invite is created you should have the ability to select an existing team or create a new team. the user is added to those teams within the org/account. Our deault team that all accounts have is called 'General', lets rename this to 'All Members', by default when a user is invited to an account it is added to the team 'All Members', but can be added to multiple teams from the drop down.
- [ ] TASK011: Add csv import with user name, email and team name.
- [ ] TASK012: Create a script 
- [ ] TASK012: Allow changing team member roles.
- [ ] TASK013: stripe integration with trial period and tierd subscription based on user count. (prevent adding more users if user limit is reacehd)
- [ ] TASK014: Allow users to use custom backgrounds in video calls.
- [ ] TASK015: Drill into an individual user to gague sentiment and health
- [ ] TASK016: Update twilio ci wh address https://console.twilio.com/us1/develop/conversational-intelligence/services/GAcef02b863aa92161ebbad70ef2eccd31/webhooks
- [ ] TASK017: Update twilio wh address https://console.twilio.com/us1/develop/video/manage/room-settings?frameUrl=%2Fconsole%2Fvideo%2Fconfigure%3Fx-target-region%3Dus1


## Bugs

- [x] BUG001: fix profile saving issue
- [x] BUG002: fix general member users should not have acces to /teams
- [x] BUG003: fix general member users should not have acces to /analytics
- [x] BUG004: fix general member users should not have acces to /schedules





