// Copyright © 2025 Meroxa, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import Fastify from "fastify";
import OpenAI from "openai";

const openai = new OpenAI();

const fastify = Fastify({
  logger: true,
});

const systemMessage =
  "You are a helpful AI assistant that answers questions using retrieved information from a knowledge base. Your primary goal is to provide accurate, well-sourced responses based on the retrieved context while being transparent about the limitations of your knowledge.";

fastify.register(import("@fastify/postgres"), {
  connectionString: process.env.POSTGRES_URL,
});

fastify.post("/query", async function (request, reply) {
  const embedQueryReq = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: request.body.query,
    encoding_format: "float",
    dimensions: 768,
  });

  const queryEmbedding = JSON.stringify(embedQueryReq.data[0].embedding);
  const client = await fastify.pg.connect();
  let results;

  try {
    const { rows } = await client.query(
      "SELECT * FROM demo ORDER BY embedding <-> $1 LIMIT 10;",
      [queryEmbedding]
    );
    results = rows;
  } finally {
    client.release();
  }

  const originalTexts = results.map((r) => r.original).join("\n\n\n\n");

  const userMessage = `# Retrieved context:\n${originalTexts}\n# User query:\n${request.body.query}`;

  const queryReq = await openai.responses.create({
    input: userMessage,
    instructions: systemMessage,
    model: "gpt-4.1",
  });

  reply.send({ output: queryReq.output_text });
});

fastify.listen({ port: 8090 }, function (err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
