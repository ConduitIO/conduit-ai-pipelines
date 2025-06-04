# Conduit AI Ticket Summarizer Demo

An intelligent data pipeline that automatically summarizes customer support tickets from PostgreSQL and posts them to Slack using OpenAI's GPT models.

## Overview

This Conduit pipeline demonstrates how to build a real-time AI-powered notification system for customer support teams. When new tickets are added to your PostgreSQL database, the pipeline automatically:

1. **Captures** new ticket records from a PostgreSQL `tickets` table
2. **Summarizes** the ticket content using OpenAI's GPT models
3. **Formats** the summary with ticket metadata 
4. **Delivers** formatted notifications to a Slack channel via webhook

This creates an automated workflow that keeps support teams informed with concise, AI-generated summaries of incoming tickets without manual intervention.

## Pipeline Processing Flow

### Source: PostgreSQL Connector
- **Plugin**: `postgres`
- **Function**: Monitors the `tickets` table for new records
- **Configuration**: Uses change data capture to detect INSERT operations
- **Output**: Streams new ticket records in real-time

### Processors

#### 1. OpenAI Text Generation (`openai.textgen`)
- **Purpose**: Generates concise summaries of ticket messages
- **Model**: GPT-4.1 (configurable)
- **Input Field**: `.Payload.After.message` (the ticket message content)
- **Prompt**: "Perform a summarization of the following user text. ONLY return the summary, and no annotations or labels."
- **Output**: AI-generated summary replaces the original message

#### 2. Field Rename (`field.rename`)
- **Purpose**: Renames the message field to "text" for Slack compatibility
- **Mapping**: `.Payload.After.message` → `text`
- **Reason**: Standardizes field naming for the destination format

#### 3. Field Set (`field.set`)
- **Purpose**: Creates a formatted Slack message with ticket context
- **Template**: `*NEW TICKET FROM USER {{.Payload.After.id}}*\n{{.Payload.After.text}}`
- **Result**: Combines ticket ID with the AI summary in Slack-friendly markdown

#### 4. Field Exclude (`field.exclude`)
- **Purpose**: Removes sensitive or unnecessary fields before sending to Slack
- **Excluded**: `.Payload.After.id` (already included in the formatted message)
- **Reason**: Reduces payload size and prevents data leakage

### Destination: HTTP/Slack Webhook
- **Plugin**: `http`
- **Method**: POST to Slack webhook URL
- **Headers**: `Content-type: application/json`
- **Payload**: JSON containing the formatted ticket summary

## Prerequisites

### 1. PostgreSQL Database
- A PostgreSQL instance with a `tickets` table
- Required columns (minimum):
  - `id` - Unique ticket identifier
  - `message` - The main ticket content to be summarized
- CDC (Change Data Capture) enabled for real-time streaming

### 2. OpenAI API Access
- Valid OpenAI API key with access to GPT models
- Sufficient API quota for your expected ticket volume

### 3. Slack Webhook
- Slack workspace with webhook integration enabled
- Webhook URL for the target channel where notifications should be posted

### 4. Database Setup

Your PostgreSQL `tickets` table should have at minimum:

```sql
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Add other fields as needed (user_id, priority, etc.)
);
```

## Installation & Setup

### 1. Environment Variables

```bash
# Database
export POSTGRES_URL="postgresql://username:password@host:port/database"
# OpenAI
export OPENAI_API_KEY="sk-your-openai-api-key-here"
# Slack
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

### 2. Run Conduit Pipeline

```bash
# in examples/summarize
conduit run
```
For more information on installing and running conduit, [see the official docs](https://conduit.io/docs)

## Usage Examples

### Adding Ticket records
When a new ticket is inserted:
```sql
INSERT INTO tickets (id, message) VALUES 
(123, 'My application keeps crashing when I try to upload large files. The error message says "memory allocation failed" and it happens every time I select files larger than 50MB. This is blocking my work and I need help urgently.');
```

### Output Slack Message
The Slack channel receives:
```
*NEW TICKET FROM USER 123*
User experiencing application crashes when uploading files larger than 50MB due to memory allocation errors, requiring urgent assistance.
```

## Customization Options

### Modify AI Summarization
- **Change Model**: Update `model` field (e.g., "gpt-3.5-turbo", "gpt-4")
- **Adjust Prompt**: Modify `developer_message` for different summary styles
- **Target Different Field**: Change `field` to summarize other columns

### Customize Slack Formatting
- **Message Template**: Modify the `value` in the `field.set` processor
- **Add Fields**: Include additional ticket metadata in the message
- **Styling**: Use Slack markdown for bold, italics, links, etc.

### Add More Processing
- **Sentiment Analysis**: Add another OpenAI processor for sentiment detection
- **Priority Classification**: Use AI to categorize ticket urgency
- **Translation**: Add translation for multi-language support
- **Filtering**: Add conditions to only process certain types of tickets

### Multiple Destinations
- **Email Notifications**: Add SMTP connector for email alerts
- **Database Logging**: Store summaries back to PostgreSQL
- **Multiple Slack Channels**: Route different ticket types to different channels

## Monitoring & Troubleshooting

### Check Pipeline Status
```bash
# View pipeline status via HTTP API
curl http://localhost:8080/v1/pipelines

# View detailed pipeline information
curl http://localhost:8080/v1/pipelines/showcase-summarize
```

### Common Issues

1. **PostgreSQL Connection Fails**
   - Verify connection string format and credentials
   - Ensure PostgreSQL allows connections from Conduit host
   - Check if CDC is properly configured

2. **OpenAI API Errors**
   - Verify API key validity and quota
   - Check if the specified model is available
   - Monitor API rate limits

3. **Slack Messages Not Appearing**
   - Test webhook URL independently
   - Verify JSON payload format
   - Check Slack app permissions

## Performance Considerations

- **OpenAI Rate Limits**: Monitor API usage to avoid hitting rate limits
- **Database Load**: Consider adding batch processing for high-volume scenarios  
- **Memory Usage**: Large ticket messages may require memory optimization
- **Error Handling**: Implement retry logic for transient failures

## Security Notes

- Store API keys and connection strings as environment variables
- Use least-privilege database credentials
- Regularly rotate API keys and webhooks
- Consider encrypting sensitive data in transit and at rest

For more advanced Conduit features, visit the [official documentation](https://conduit.io/docs).