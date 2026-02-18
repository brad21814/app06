## Tasks

- [x] TASK001: determine metrics we want to track.
- [x] TASK002: Plan analytics feature (tracking, storage, display) @[context/features/analytics_dashboard.md]
- [x] TASK003: Record marker between transcription identifying the conversation for each question interval.
- [x] TASK004: Create component to list a users past connections. Place this on the dashboard page only for 'member' and 'admin' user types.
- [x] TASK005: Update dashboard page to be specific for the individual user types. e.g. 'admin', 'owner', 'member'.  If you have to just add plaeholder components for what each user could be presented.
- [x] TASK006: Update dashboard to show analytics for 'admin' users.
- [x] TASK007: Create clear and seeding script to reset our firebase environment and populate it with a small amount of test data. This should include  clearing firestore documents, firebase auth users and creating default themes  with 20 questions for each theme.  The themes should be related team building, general knowledge that might apply across the world. Themes and questions that would porove good talking points for team members it could be sport, food, books, movies, or more aligned with industry.  The themese should follwo the existing theme structure however the accountId should remain NULL, this would allow us to know that themses themes are avaialbe to all accounts, however should not be allowed to be edited.  The should be showen in the themes page as 'System' or 'Standard' themes for use by any account.

- [x] TASK010: Allow adding users to multiple teams.  When an invite is created you should have the ability to select an existing team or create a new team. the user is added to those teams within the org/account. Our deault team that all accounts have is called 'General', lets rename this to 'All Members', by default when a user is invited to an account it is added to the team 'All Members', but can be added to multiple teams from the drop down.

- [x] TASK011: Add csv import option when adding Team Members. Team names should match case insisitive , otherwise they will be created. CSV format would be <name>,<email>,<role>,<list of teams as Team|Team|Team (excluding All Members as that is added by default)>.  The role should be 'member' or 'admin'.

- [ ] TASK008: Modify the connections page once a connection is completed it should show a summary of the questions and answers. e.g. when did it happen, what questions were asked, who were the participants and a summary of the responses per question. Maybe keep a Reconnect button that would start the session again and overwrite any assets recorded from the old session.


- [ ] TASK012: Allow changing existing team member roles from the Team management page. They cannot be removed from the 'All Members' team.  They can be removed from other teams.  The owner cannot be changed.
- [ ] TASK013: stripe integration with trial period and tiered subscription based on user count. (prevent adding more users if user limit is reacehd)

- [ ] TASK014: Allow users to use custom backgrounds in video calls.

- [ ] TASK015: Drill into an individual user to gague sentiment and health

## Go Live Tasks
- [ ] TASK015.5: Update the domain name to be app06.komandra.com
- [ ] TASK015.6: Update from postmark email address
- [ ] TASK015.7: Create environment and app hosting xml for prod environment. rename current environment test
- [ ] TASK016: Update twilio ci wh address https://console.twilio.com/us1/develop/conversational-intelligence/services/GAcef02b863aa92161ebbad70ef2eccd31/webhooks
- [ ] TASK017: Update twilio wh address https://console.twilio.com/us1/develop/video/manage/room-settings?frameUrl=%2Fconsole%2Fvideo%2Fconfigure%3Fx-target-region%3Dus1


## Bugs

- [x] BUG001: fix profile saving issue
- [x] BUG002: fix general member users should not have acces to /teams
- [x] BUG003: fix general member users should not have acces to /analytics
- [x] BUG004: fix general member users should not have acces to /schedules





