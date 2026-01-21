-- Schedule the settlement engine cron job to run every 5 minutes
SELECT cron.schedule(
  'settlement-engine-cron',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url:='https://rxhnadjzwyrlkkwpaxlt.supabase.co/functions/v1/settlement-engine',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4aG5hZGp6d3lybGtrd3BheGx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NjMzOTEsImV4cCI6MjA4NDMzOTM5MX0.5xQkPjyY95clLWDZDiGD-KfkajwgFACzYLieAwbeFkY"}'::jsonb,
    body:='{"trigger": "cron"}'::jsonb
  ) as request_id;
  $$
);