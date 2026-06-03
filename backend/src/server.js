import { PORT } from './config.js';
import app from './app.js';
import { startTrialExpireJob } from './jobs/trialExpireJob.js';

// Start scheduled jobs
startTrialExpireJob();

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
