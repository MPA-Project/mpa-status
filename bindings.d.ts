export {};

declare global {

  // ENV
  const SECRET_SLACK_WEBHOOK_URL: string;
  const SECRET_TELEGRAM_API_TOKEN: string;
  const SECRET_TELEGRAM_CHAT_ID: string;
  const SECRET_DISCORD_WEBHOOK_URL: string;
  const AWS_S3_ENDPOINT: string;
  const AWS_S3_REGION: string;
  const AWS_S3_BUCKET: string;
  const AWS_S3_ACCESS_KEY: string;
  const AWS_S3_SECRET_KEY: string;
  const STORE_FILENAME: string;

  
  const KV_STATUS_PAGE: KVNamespace;
}