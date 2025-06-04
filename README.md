# Conduit AI Pipelines

Real-world examples of AI-powered data pipelines built with [Conduit](https://conduit.io) - demonstrating how to integrate modern AI services into production data workflows.

## Overview

This repository showcases practical AI pipeline implementations using Conduit's data streaming capabilities. Each example demonstrates different aspects of building intelligent, real-time data processing systems that integrate with popular AI services like OpenAI, cloud storage, and vector databases.

## Examples

### [AI Ticket Summarizer](./examples/summarize/)
**Real-time customer support automation**
- **Source**: PostgreSQL (support tickets)
- **AI Processing**: OpenAI GPT-4 summarization
- **Destination**: Slack webhooks
- **Use Case**: Automatically summarize and notify teams of new support tickets

### [RAG Knowledge System](./examples/doc-embeddings/)
**Real-time ingest document processing and intelligent search**
- **Source**: AWS S3 (documents)
- **AI Processing**: Document parsing + OpenAI embeddings + vector search
- **Destination**: PostgreSQL with pgvector
- **Use Case**: Build searchable knowledge bases from document collections
- **Includes**: Document parsing service + RAG query API

## Quick Start

1. **Install Conduit**
   ```bash
   # Download latest release
   curl -sSL https://get.conduit.io | sh
   
   # Or use Homebrew
   brew install conduit
   ```

2. **Choose an Example**
   ```bash
   cd examples/summarize 
   ```

3. **Follow Setup Instructions**
   Each example includes detailed setup instructions and environment configuration in the respective README