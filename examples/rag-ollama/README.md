# Conduit RAG System Demo

A complete Retrieval Augmented Generation (RAG) system that's continuously
updated using Conduit, processing documents from S3, chunking them using
unstructured, generating embeddings using Ollama, storing them in Supabase, and
providing a UI for querying the knowledge base.

## Overview

This demonstration showcases a RAG pipeline that transforms unstructured
documents into searchable, AI-powered knowledge bases. The system automatically:

1. **Ingests** documents from AWS S3 storage
2. **Parses** and **chunks** complex document formats (PDFs, Word docs, etc.)
   using Unstructured.io
3. **Generates** vector embeddings using Ollama running locally
4. **Stores** searchable chunks and embeddings in Supabase
5. **Provides** a user interface for querying the knowledge base using Chatbot-UI

This creates a complete knowledge management system that can understand and
answer questions about your document collection using AI, but most importantly,
ingests documents in real time, keeping the system continuously up to date.

## Quick Start

1. Clone this repository:
   ```sh
   git clone git@github.com:ConduitIO/conduit-ai-pipelines.git
   ```
2. Install [Conduit](https://conduit.io/docs/getting-started) (at least version v0.14.0):
   ```sh
   curl https://conduit.io/install.sh | bash # On MacOS and Linux
   ```
3. Install [Supabase](https://supabase.com/docs/guides/local-development):
   ```sh
   brew install supabase/tap/supabase # On MacOS
   ```
4. Install [Ollama](https://ollama.com/download):
   ```sh
   brew install ollama # On MacOS
   ```
5. Copy and fill out the AWS credentials in `.env`, then evaluate the file:
   ```sh
   cp .env.example .env
   source .env
   ```
6. Initialize and run the example:
   ```sh
   make init up
   ```

After this, a browser window should open at http://localhost:3000, where you can
log in using the default credentials:

```
Username: test@test.com
Password: password
```

Choose the "Conduit" assistant, and you can start querying the knowledge base.
Drop a document into your S3 bucket and Conduit will automatically process it
and update the knowledge base.

To stop the example, run:

```sh
make down
```

## Components

### 1. Conduit Pipeline ([`rag.yaml`](./piopelines/rag.yaml))

The main data processing pipeline that orchestrates document ingestion and
embedding generation.

### 2. Document Processing Service ([unstructured](./unstructured))

- **Purpose**: Parses complex document formats into structured text chunks
- **Technology**: Unstructured.io library with FastAPI
- **Input**: Base64-encoded document data
- **Output**: Structured JSON with text chunks

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

### 3. Supabase

- **Purpose**: Stores document chunks with vector embeddings
- **Schema**: Using the chatbot-ui schema for storing documents and embeddings

### 4. Ollama

- **Purpose**: Generates vector embeddings for document chunks
- **Technology**: Ollama running locally with the `all-minilm:l6-v2` model

### 5. Chatbot-UI

- **Purpose**: Provides a user-friendly interface for querying the knowledge base
- **Technology**: React-based UI that connects to the RAG query service
- **Input**: Natural language queries
- **Output**: AI-generated answers based on document content

## Monitoring & Performance

### Pipeline Metrics

```bash
# Check pipeline status
curl http://localhost:8080/v1/pipelines/chatbot-ui

# View processing metrics
curl http://localhost:8080/v1/metrics
```

### Database Statistics

```sql
-- Check total documents processed
SELECT COUNT(*)
FROM files;

-- View sample embeddings
SELECT content, length(local_embedding::text) as embedding_size
FROM file_items LIMIT 5;

-- Test similarity search
SELECT content, local_embedding < - > '[your_query_embedding]' as distance
FROM file_items
ORDER BY local_embedding < - > '[your_query_embedding]' LIMIT 5;
```

## Troubleshooting

### Common Issues

1. **Document Processing Fails**
    - Check if Unstructured service is running on port 8089
    - Verify document format is supported
    - Monitor service logs for parsing errors

2. **Embedding Generation Errors**
    - Check text chunk sizes (max ~4000 tokens)

3. **Vector Search Issues**
    - Verify embedding dimensions match (384)
    - Check index creation on embedding column

4. **S3 Connection Problems**
    - Validate AWS credentials and permissions
    - Verify bucket name and region
    - Check S3 bucket policies

### Performance Optimization

- **Batch Processing**: Configure S3 source for batch operations on large
  document sets
- **Chunking Strategy**: Adjust Unstructured chunking parameters for optimal
  chunk sizes
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
