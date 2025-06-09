# Conduit AI Sentiment Analysis Demo

An intelligent data pipeline that automatically analyzes sentiment of customer reviews from PostgreSQL and posts notifications to Slack using OpenAI's GPT models.

## Overview

This Conduit pipeline demonstrates how to build a real-time AI-powered sentiment monitoring system for customer feedback teams. When new reviews are added to your PostgreSQL database, the pipeline automatically:

1. **Captures** new review records from a PostgreSQL `reviews` table
2. **Analyzes** the review content sentiment using OpenAI's GPT models
3. **Formats** the sentiment result with review metadata 
4. **Delivers** formatted notifications to a Slack channel via webhook

This creates an automated workflow that keeps teams informed with real-time sentiment analysis of incoming customer reviews without manual intervention.

## Pipeline Processing Flow

### Source: PostgreSQL Connector
- **Plugin**: `postgres`
- **Function**: Monitors the `reviews` table for new records
- **Configuration**: Uses change data capture to detect INSERT operations
- **Output**: Streams new review records in real-time

### Processors

#### 1. OpenAI Text Generation (`openai.textgen`)
- **Purpose**: Performs sentiment analysis on review content
- **Model**: GPT-4.1 (configurable)
- **Input Field**: `.Payload.After.content` (the review content)
- **Prompt**: "Perform sentiment analysis on the user text. Classify as positive, negative, or neutral. Use only POSITIVE, NEGATIVE, or NEUTRAL in your response."
- **Output**: AI-generated sentiment classification (POSITIVE, NEGATIVE, or NEUTRAL)

#### 2. Field Rename (`field.rename`)
- **Purpose**: Renames the content field to "text" for Slack compatibility
- **Mapping**: `.Payload.After.content` → `text`
- **Reason**: Standardizes field naming for the destination format

#### 3. Field Set (`field.set`)
- **Purpose**: Creates a formatted Slack message with sentiment result
- **Template**: `NEW REVIEW WITH *{{.Payload.After.text}}* SENTIMENT`
- **Result**: Combines sentiment classification in Slack-friendly markdown format

#### 4. Field Exclude (`field.exclude`)
- **Purpose**: Removes sensitive or unnecessary fields before sending to Slack
- **Excluded**: `.Payload.After.id` (not needed in Slack notification)
- **Reason**: Reduces payload size and prevents data leakage

### Destination: HTTP/Slack Webhook
- **Plugin**: `http`
- **Method**: POST to Slack webhook URL
- **Headers**: `Content-type: application/json`
- **Payload**: JSON containing the formatted sentiment notification

## Prerequisites

### 1. PostgreSQL Database
- A PostgreSQL instance with a `reviews` table
- Required columns (minimum):
  - `id` - Unique review identifier
  - `content` - The main review content to be analyzed
- CDC (Change Data Capture) enabled for real-time streaming

### 2. OpenAI API Access
- Valid OpenAI API key with access to GPT models
- Sufficient API quota for your expected review volume

### 3. Slack Webhook
- Slack workspace with webhook integration enabled
- Webhook URL for the target channel where notifications should be posted

### 4. Database Setup

Your PostgreSQL `reviews` table should have at minimum:

```sql
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Add other fields as needed (user_id, product_id, rating, etc.)
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
# in examples/sentiment-analysis
conduit run
```
For more information on installing and running conduit, [see the official docs](https://conduit.io/docs)

## Usage Examples

### Adding Review Records
When a new review is inserted:
```sql
INSERT INTO reviews (id, content) VALUES 
(456, 'This product is absolutely amazing! The quality exceeded my expectations and the customer service was outstanding. I would definitely recommend this to anyone looking for a reliable solution.');
```

### Output Slack Message
The Slack channel receives:
```
NEW REVIEW WITH *POSITIVE* SENTIMENT
```

For a negative review:
```sql
INSERT INTO reviews (id, content) VALUES 
(457, 'Very disappointed with this purchase. The product broke after just two days and the support team was completely unhelpful. Would not buy again.');
```

The Slack channel receives:
```
NEW REVIEW WITH *NEGATIVE* SENTIMENT
```

## Customization Options

### Modify AI Sentiment Analysis
- **Change Model**: Update `model` field (e.g., "gpt-3.5-turbo", "gpt-4")
- **Adjust Prompt**: Modify `developer_message` for different classification schemes (e.g., include confidence scores)
- **Target Different Field**: Change `field` to analyze other columns
- **Add Granularity**: Modify prompt for 5-point scale or emotion detection

### Customize Slack Formatting
- **Message Template**: Modify the `value` in the `field.set` processor
- **Add Fields**: Include additional review metadata (product, user, rating)
- **Styling**: Use Slack markdown for bold, italics, links, etc.
- **Conditional Formatting**: Use different emoji or colors based on sentiment

### Add More Processing
- **Review Summarization**: Add another OpenAI processor for review summaries
- **Product Classification**: Use AI to categorize review topics
- **Urgency Detection**: Identify reviews requiring immediate attention
- **Filtering**: Add conditions to only process reviews with certain characteristics

### Multiple Destinations
- **Email Notifications**: Add SMTP connector for email alerts on negative reviews
- **Database Logging**: Store sentiment results back to PostgreSQL
- **Multiple Slack Channels**: Route different sentiment types to different channels
- **Dashboard Integration**: Send data to analytics platforms

## Monitoring & Troubleshooting

### Check Pipeline Status
```bash
# View pipeline status via HTTP API
curl http://localhost:8080/v1/pipelines

# View detailed pipeline information
curl http://localhost:8080/v1/pipelines/sentiment-analysis
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

4. **Inconsistent Sentiment Classification**
   - Review prompt engineering for better consistency
   - Consider using temperature settings for more deterministic results
   - Monitor edge cases and ambiguous review content

## Performance Considerations

- **OpenAI Rate Limits**: Monitor API usage to avoid hitting rate limits
- **Database Load**: Consider adding batch processing for high-volume scenarios  
- **Memory Usage**: Large review content may require memory optimization
- **Error Handling**: Implement retry logic for transient failures

## Security Notes

- Store API keys and connection strings as environment variables
- Use least-privilege database credentials
- Regularly rotate API keys and webhooks
- Consider encrypting sensitive data in transit and at rest

For more advanced Conduit features, visit the [official documentation](https://conduit.io/docs).