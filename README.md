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

### [AI Sentiment Analysis](./examples/sentiment-analysis/)
**Real-time customer feedback monitoring**
- **Source**: PostgreSQL (customer reviews)
- **AI Processing**: OpenAI GPT-4 sentiment classification
- **Destination**: Slack webhooks
- **Use Case**: Automatically analyze and notify teams of customer review sentiment

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

## Prerequisites

- [Conduit](https://conduit.io/docs/getting-started) (latest version)
- OpenAI API key for AI processing
- Database access (PostgreSQL recommended)
- Cloud storage credentials (AWS S3 for RAG example)

## Features Demonstrated

- **AI Integration**: OpenAI GPT models, embeddings, and text processing
- **Real-time Processing**: Stream processing with immediate AI-powered transformations
- **Vector Databases**: pgvector integration for similarity search and retrieval
- **API Orchestration**: HTTP processors for external service integration
- **Data Transformation**: Complex multi-step processing workflows
- **Custom Processing**: JavaScript processors for domain-specific logic
- **Multiple Connectors**: S3, PostgreSQL, HTTP webhooks, and more

## Getting Help

- **Documentation**: [conduit.io/docs](https://conduit.io/docs)
- **Community**: [Discord](https://discord.meroxa.com)
- **Issues**: [GitHub Issues](https://github.com/ConduitIO/conduit/issues)
- **API Reference**: [docs.conduit.io/api](https://docs.conduit.io/api)

## Related Projects

- **[Conduit](https://github.com/ConduitIO/conduit)** - The core data streaming platform
- **[Conduit Connectors](https://conduit.io/docs/using/connectors/list)** - Full list of available connectors
- **[Conduit Processors](https://conduit.io/docs/using/processors/builtin/)** - Built-in data transformation capabilities

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
