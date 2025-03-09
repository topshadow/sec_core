Deno.cron('Sample cron', '* * * * *', () => {
  console.log('Every minute, Deno Deploy runs this without a server');
});
