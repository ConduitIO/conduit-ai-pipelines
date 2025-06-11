# Conduit RAG System Demo

A complete Retrieval Augmented Generation (RAG) system built with Conduit that automatically processes documents from S3, generates embeddings, and provides intelligent query capabilities.

## Overview

This demonstration showcases a RAG pipeline that transforms unstructured documents into searchable, AI-powered knowledge bases. The system automatically:

1. **Ingests** documents from AWS S3 storage
2. **Parses** complex document formats (PDFs, Word docs, etc.) using Unstructured.io
3. **Chunks** documents into semantically meaningful pieces
4. **Generates** vector embeddings using OpenAI's embedding models
5. **Stores** searchable chunks and embeddings in PostgreSQL with pgvector
6. **Provides** intelligent query capabilities through a RAG API

This creates a complete knowledge management system that can understand and answer questions about your document collection using AI, but most importantly, ingests documents in real time, keeping the system continuously up to date.

## Components

### 1. Conduit Pipeline (`s3-unstructured-embed`)
The main data processing pipeline that orchestrates document ingestion and embedding generation.

### 2. Document Processing Service (Python/FastAPI)
- **Purpose**: Parses complex document formats into structured text chunks
- **Technology**: Unstructured.io library with FastAPI
- **Input**: Base64-encoded document data
- **Output**: Structured JSON with text chunks and metadata

### 3. RAG Query Service (Node.js/Fastify)
- **Purpose**: Provides intelligent document search and retrieval
- **Technology**: OpenAI embeddings + PostgreSQL vector search
- **Input**: Natural language queries
- **Output**: AI-generated answers based on document content

### 4. PostgreSQL Vector Database
- **Purpose**: Stores document chunks with vector embeddings
- **Extension**: pgvector for similarity search
- **Schema**: `demo` table with `original` (text) and `embedding` (vector) columns

## Pipeline Processing Flow

### Source: S3 Connector
- **Plugin**: `s3`
- **Function**: Monitors S3 bucket for new documents
- **Supported Formats**: PDFs, Word docs, PowerPoint, images, and more
- **Output**: Raw file content as binary data

### Processors

#### 1. Base64 Encoding (`base64.encode`)
- **Purpose**: Converts binary document data to base64 string
- **Field**: `.Payload.After` (the entire document content)
- **Reason**: Prepares data for HTTP transmission to parsing service

#### 2. Document Parsing (`webhook.http` → Unstructured Service)
- **Endpoint**: `POST http://127.0.0.1:8089/unstructured/partition`
- **Payload**: `{"data": "{{base64_encoded_document}}"}`
- **Processing**: Uses Unstructured.io's high-resolution parsing strategy
- **Output**: Structured elements with categories (title, text, table, etc.)

#### 3. JSON Decoding (`json.decode`)
- **Purpose**: Parses the JSON response from document service
- **Field**: `.Payload.After`
- **Result**: Structured data object with parsed document elements

#### 4. Text Extraction (`custom.javascript`)
```javascript
function process(rec) {
  const texts = rec.Payload.After.data.map((x) => {
    return x.text;
  }).filter((x) => {
   return !!x;
  });
  rec.Payload.After = StructuredData();
  rec.Payload.After["original"] = texts;
  rec.Payload.After["embeddings"] = texts;
  return rec;
}
```
- **Purpose**: Extracts clean text from parsed document elements
- **Function**: Filters out empty elements and prepares text for embedding
- **Output**: Array of text chunks ready for embedding generation

#### 5. Embedding Generation (`webhook.http` → OpenAI API)
- **Endpoint**: `POST https://api.openai.com/v1/embeddings`
- **Model**: `text-embedding-3-small` (768 dimensions)
- **Input**: Array of text chunks
- **Output**: Vector embeddings for each text chunk

#### 6. Embedding Processing (`json.decode` + `custom.javascript`)
```javascript
function process(rec) {
  const original = rec.Payload.After.original;
  const embeddings = rec.Payload.After.embeddings.data;

  const formatted = embeddings.map((e) => {
    return { 
      original: original[e.index], 
      embedding: JSON.stringify(e.embedding)
    }
  })

  rec.Payload.After = StructuredData();
  rec.Payload.After["data"] = formatted;
  return rec;
}
```
- **Purpose**: Pairs each text chunk with its corresponding embedding
- **Function**: Creates records ready for database storage

#### 7. Record Splitting (`split`)
- **Purpose**: Converts single document into multiple database records
- **Field**: `.Payload.After.data`
- **Result**: One record per text chunk/embedding pair

#### 8. Field Mapping (`field.set` processors)
- **`fset-original`**: Maps text content to `.Payload.After.original`
- **`fset-embedding`**: Maps vector data to `.Payload.After.embedding`
- **`fset-id`**: Creates unique IDs using document key + chunk index

#### 9. Cleanup (`field.exclude`)
- **Purpose**: Removes intermediate processing fields
- **Excluded**: `.Payload.After.data`
- **Result**: Clean records with only `original` and `embedding` fields

### Destination: PostgreSQL Connector
- **Plugin**: `postgres`
- **Table**: `demo`
- **Function**: Stores text chunks with their vector embeddings
- **Schema**: Supports vector similarity search with pgvector

## Prerequisites

### 1. Infrastructure
- **AWS S3**: Bucket with documents to process
- **PostgreSQL**: Database with pgvector extension enabled
- **Docker**: For running the support services

### 2. API Keys & Credentials
- AWS credentials (Access Key, Secret, Region)
- OpenAI API key with embedding model access
- PostgreSQL connection string

### 3. Database Setup
```sql
-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create demo table
CREATE TABLE demo (
    id SERIAL PRIMARY KEY,
    original TEXT NOT NULL,
    embedding vector(768) NOT NULL
);

-- Create vector similarity index
CREATE INDEX ON demo USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

## Installation & Setup

### 1. Environment Variables
```bash
# AWS Configuration
export AWS_ACCESS_KEY="your-aws-access-key"
export AWS_ACCESS_SECRET="your-aws-secret-key"
export AWS_REGION="your-aws-region"
export AWS_BUCKET="your-s3-bucket-name"

# Database
export POSTGRES_URL="postgresql://username:password@host:port/database"

# OpenAI
export OPENAI_API_KEY="sk-your-openai-api-key"
```

### 2. Start Document Processing Service & RAG Query Service
```bash
# in examples/rag-openai
docker compose up -d
```
Now your services should be running:

+ docprocserver exposed at http://localhost:8089

+ chatserver exposed at http://localhost:8090

### 3. Run Conduit Pipeline

```bash
# in examples/rag-openai
conduit run
```
For more information on installing and running conduit, [see the official docs](https://conduit.io/docs)

## Usage Examples

### Adding Documents
Simply upload documents to your configured S3 bucket:
```bash
aws s3 cp my-document.pdf s3://your-bucket-name/
aws s3 cp company-handbook.docx s3://your-bucket-name/
```

The pipeline will automatically:
1. Detect the new files
2. Parse and chunk the content
3. Generate embeddings
4. Store in PostgreSQL

### Querying the Knowledge Base
```bash
# Query the RAG system
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What is our company vacation policy?"}'
```

**Example Response:**
```json
{
  "output": "Based on the company handbook, employees are entitled to 15 days of paid vacation annually, with the ability to carry over up to 5 unused days to the following year. Vacation requests should be submitted at least 2 weeks in advance through the HR portal."
}
```

## Service Details

### Document Processing Service

**Features:**
- Accepts base64-encoded documents via HTTP POST
- Uses Unstructured.io for intelligent document parsing
- Supports multiple document formats (PDF, DOCX, PPTX, images)
- Returns structured JSON with text elements and metadata
- High-resolution parsing strategy for maximum accuracy

**API Endpoint:**
```
POST /unstructured/partition
Content-Type: application/json

{
  "data": "base64_encoded_document_content"
}
```

### RAG Query Service

**Features:**
- Converts queries to embeddings using OpenAI
- Performs vector similarity search in PostgreSQL
- Uses retrieved context to generate answers with GPT-4.1
- Extremely simple retrieval logic, do not use for production

**API Endpoint:**
```
POST /query
Content-Type: application/json

{
  "query": "Your natural language question"
}
```

**Query Processing Flow:**
1. Convert user query to embedding vector
2. Find 10 most similar document chunks using cosine similarity
3. Combine retrieved text as context
4. Generate answer using GPT-4.1 with retrieved context
5. Return AI-generated response

## Monitoring & Performance

### Pipeline Metrics
```bash
# Check pipeline status
curl http://localhost:8080/v1/pipelines/s3-unstructured-embed

# View processing metrics
curl http://localhost:8080/v1/metrics
```

### Database Statistics
```sql
-- Check total documents processed
SELECT COUNT(*) FROM demo;

-- View sample embeddings
SELECT original, length(embedding::text) as embedding_size 
FROM demo LIMIT 5;

-- Test similarity search
SELECT original, embedding <-> '[your_query_embedding]' as distance 
FROM demo 
ORDER BY embedding <-> '[your_query_embedding]' 
LIMIT 5;
```

### Service Health Checks
```bash
# Document processing service
curl http://localhost:8089/docs

# RAG query service  
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}'
```

## Troubleshooting

### Common Issues

1. **Document Processing Fails**
   - Check if Unstructured service is running on port 8089
   - Verify document format is supported
   - Monitor service logs for parsing errors

2. **Embedding Generation Errors**
   - Verify OpenAI API key and quota
   - Check text chunk sizes (max ~8000 tokens)
   - Monitor rate limiting

3. **Vector Search Issues**
   - Ensure pgvector extension is installed
   - Verify embedding dimensions match (768)
   - Check index creation on embedding column

4. **S3 Connection Problems**
   - Validate AWS credentials and permissions
   - Verify bucket name and region
   - Check S3 bucket policies

### Performance Optimization

- **Batch Processing**: Configure S3 source for batch operations on large document sets
- **Chunking Strategy**: Adjust Unstructured chunking parameters for optimal chunk sizes
- **Index Tuning**: Optimize pgvector index parameters for your query patterns
- **Caching**: Implement caching for frequently accessed embeddings

## Production Considerations

### Security
- Use IAM roles instead of hardcoded AWS keys
- Implement API authentication for query service
- Encrypt sensitive data in transit and at rest
- Regular security audits of dependencies

### Scalability
- **Horizontal Scaling**: Deploy multiple Conduit instances
- **Database Scaling**: Consider sharding large embedding tables
- **Service Scaling**: Run document processing service in containers
- **CDN Integration**: Cache processed documents

### Reliability
- **Error Handling**: Implement retry logic for transient failures
- **Monitoring**: Set up alerts for pipeline health and performance
- **Backup Strategy**: Regular backups of vector database
- **Disaster Recovery**: Multi-region deployment for critical systems
