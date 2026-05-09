package com.example.coursetutor.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;

/**
 * VectorStore config for RAG.
 * Disabled by default since the project uses MySQL as the primary database.
 * RAG retrieval is handled by the external RAG microservice (see RagService).
 */
@Configuration
@ConditionalOnProperty(name = "app.rag.use-pgvector", havingValue = "true", matchIfMissing = false)
public class VectorStoreConfig {
    // PGVector requires PostgreSQL. When MySQL is the primary DB,
    // use the external RAG service instead.
    // To enable, set app.rag.use-pgvector=true and configure PostgreSQL.
}
