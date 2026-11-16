/**
 * Embeddings, Vector Databases & RAG
 * Program: Enterprise AI & Solutions Architecture, step 7
 *
 * Dry run (checks the content, writes nothing):
 *   node scripts/embeddings-rag/seed-embeddings-rag.mjs
 * Create the course:
 *   node scripts/embeddings-rag/seed-embeddings-rag.mjs --apply
 * Update an existing course (keeps its status, publish date and final exam):
 *   node scripts/embeddings-rag/seed-embeddings-rag.mjs --apply --overwrite
 *
 * Lesson text uses the light Markdown lessons support: # / ## / ### headings,
 * - and 1. lists, **bold**, *italic*, `code`, ``` code blocks, > quotes and
 * | tables |. Each text block is one section in the lesson player; its first
 * heading is the section title.
 */

import { runCourseSeed } from '../lib/write-zebron-course.mjs';

const COURSE = {
  id: "embeddings-vector-databases-rag",
  title: "Embeddings, Vector Databases & RAG",
  summary: "Learn how AI applications represent information as vectors, perform semantic search, use vector databases, and build Retrieval-Augmented Generation systems.",
  description: "This course introduces vector embeddings, similarity search, vector database architecture, document processing, and Retrieval-Augmented Generation. Learners explore how enterprise AI systems retrieve relevant information from organizational knowledge sources and use it to generate grounded responses.",
  topic: "Artificial Intelligence",
  program: "Enterprise AI & Solutions Architecture",
  programOrder: 7,
  level: "intermediate",
  cover: "violet",
  outcomes: [
    "Explain how embeddings represent information numerically.",
    "Understand semantic similarity and vector search.",
    "Compare common similarity and distance metrics.",
    "Understand vector database architecture.",
    "Explain how documents are processed for AI retrieval.",
    "Design effective document chunking strategies.",
    "Understand Retrieval-Augmented Generation.",
    "Build a conceptual RAG pipeline.",
    "Understand retrieval optimization techniques.",
    "Evaluate RAG quality and security.",
    "Design an enterprise knowledge assistant using RAG.",
  ],
  skills: [
    "AI Embeddings",
    "Vector Representations",
    "Semantic Search",
    "Similarity Search",
    "Vector Databases",
    "Document Processing",
    "Text Chunking",
    "Retrieval-Augmented Generation",
    "RAG Architecture",
    "Knowledge Retrieval",
    "AI Evaluation",
    "Enterprise AI Architecture",
  ],
};

const MODULES = [
  {
    id: "introduction-to-embeddings",
    title: "Introduction to Embeddings",
    lessons: [
      {
        id: "what-are-ai-embeddings",
        title: "What Are AI Embeddings?",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# What Are AI Embeddings?

AI embeddings are numerical representations of information.

They allow AI systems to represent words, sentences, documents, images, and other types of data as mathematical vectors.

A vector is an ordered collection of numbers.

For example:

[0.21, 0.84, -0.32, 0.67]

This vector represents information in a numerical format that an AI system can process.

## Why Do We Need Embeddings?

Computers work with numerical information.

However, people communicate using natural language.

Embeddings help bridge this gap by converting information into numerical representations that capture aspects of meaning and relationships.

## Example

Consider these sentences:

1. "How do I reset my password?"
2. "I forgot my login credentials."
3. "What is the weather today?"

The first two sentences have similar meanings even though they use different words.

An embedding model may generate vectors that are closer together for the first two sentences than for the third.

This enables semantic search.

## Semantic Meaning

Traditional keyword search looks for matching words.

Semantic search attempts to identify information based on meaning.

For example, a search for:

"How do I recover my account?"

could retrieve a document titled:

"Password Reset Instructions."

The wording differs, but the meaning is related.

## Where Embeddings Are Used

Embeddings support:

- Semantic search.
- Recommendation systems.
- Document retrieval.
- Image similarity.
- Duplicate detection.
- Retrieval-Augmented Generation.
- Knowledge assistants.

## Enterprise Example

An organization has thousands of internal knowledge articles.

Instead of searching only for matching keywords, an AI application can use embeddings to identify articles that are semantically related to an employee's question.

## Key Principle

Embeddings transform information into numerical representations that make similarity-based retrieval possible.`,
          },
          {
            type: 'check',
            question: "What is the primary purpose of an AI embedding?",
            options: [
              "To translate text into a single standard language",
              "To encrypt documents before they are stored",
              "To compress documents so they take less storage space",
              "To represent meaning numerically so similar items are close together",
            ],
            answer: 3,
            explanation: "Embeddings represent information as numerical vectors that AI systems can use for similarity comparisons and retrieval.",
          },
        ],
      },
      {
        id: "how-embedding-models-work",
        title: "How Embedding Models Work",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# How Embedding Models Work

An embedding model converts input information into a numerical vector.

The model has been trained to produce representations that capture useful patterns and relationships in the input.

## Basic Workflow

1. Provide text to an embedding model.
2. The model processes the text.
3. The model generates a numerical vector.
4. The application stores or uses the vector.
5. Other vectors can be compared against it.

## Example

Input:

"Enterprise cloud architecture"

Possible embedding:

[0.15, -0.42, 0.83, 0.27, ...]

The numbers are illustrative. Actual embeddings may contain hundreds or thousands of dimensions.

## Dimensions

The number of values in an embedding is called its dimensionality.

For example:

- A 3-dimensional vector contains three values.
- A 768-dimensional vector contains 768 values.
- A 1536-dimensional vector contains 1536 values.

Different embedding models may produce vectors with different dimensions.

## Model Compatibility

Vectors produced by different embedding models should not automatically be compared.

The dimensions, training characteristics, and vector spaces may differ.

Use a consistent embedding model for documents and queries within the same retrieval system unless you have a deliberate migration strategy.

## Enterprise Example

A company processes its knowledge articles using an embedding model.

When an employee submits a question, the same compatible embedding model converts the question into a vector.

The application compares the query vector against stored document vectors to identify relevant content.

## Key Principle

An embedding model converts information into vectors that allow applications to compare semantic relationships.`,
          },
          {
            type: 'check',
            question: "What does embedding dimensionality describe?",
            options: [
              "The number of users accessing an application",
              "The size of a user's browser window",
              "The number of numerical values in a vector",
              "The number of documents in a database",
            ],
            answer: 2,
            explanation: "Embedding dimensionality is the number of numerical components contained in an embedding vector.",
          },
        ],
      },
      {
        id: "choosing-an-embedding-model",
        title: "Choosing an Embedding Model",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# Choosing an Embedding Model

Embedding models differ in performance, dimensionality, language support, cost, and intended use.

Selecting the right model is an important architectural decision.

## 1. Dimensionality

Different models generate vectors with different numbers of dimensions.

Higher dimensionality can represent complex patterns, but it may also increase storage and computational requirements.

More dimensions do not automatically guarantee better retrieval.

## 2. Language Support

Some embedding models support multiple languages.

This is important for organizations that operate across countries or maintain multilingual documentation.

## 3. Performance

Evaluate how accurately the model retrieves relevant information for your actual business use cases.

A model that performs well on general benchmarks may not perform equally well on specialized enterprise documents.

## 4. Cost

Consider:

- Embedding generation costs.
- Query embedding costs.
- Storage requirements.
- Processing volume.
- Provider pricing.

## 5. Deployment Options

Embedding models may be available through:

- Hosted AI APIs.
- Cloud AI platforms.
- Self-hosted models.
- Open-source model ecosystems.

## 6. Data Governance

Evaluate where data is processed and whether the provider's data handling practices meet organizational requirements.

## Enterprise Example

A multinational company may need an embedding model that supports English, French, and Spanish because its internal knowledge base contains documents in all three languages.

## Selection Criteria

Before choosing a model, evaluate:

1. Retrieval quality.
2. Language requirements.
3. Dimensionality.
4. Latency.
5. Cost.
6. Security.
7. Operational complexity.

## Key Principle

Choose an embedding model based on measurable application requirements, not simply model popularity.`,
          },
          {
            type: 'check',
            question: "Which factor should be considered when selecting an embedding model?",
            options: [
              "The color of the model's user interface",
              "The number of employees in the organization only",
              "Only the model's name",
              "Retrieval quality, language support, cost, and governance",
            ],
            answer: 3,
            explanation: "Embedding model selection should consider performance, language support, cost, and organizational requirements.",
          },
        ],
      },
    ],
  },
  {
    id: "understanding-vector-representations",
    title: "Understanding Vector Representations",
    lessons: [
      {
        id: "vectors-and-vector-spaces",
        title: "Vectors and Vector Spaces",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# Vectors and Vector Spaces

A vector is an ordered collection of numerical values.

In AI applications, vectors are used to represent information such as words, sentences, and documents.

## Simple Vector Example

A two-dimensional vector can be represented as:

[3, 5]

It contains two numerical components.

A three-dimensional vector may be represented as:

[3, 5, 2]

Real-world AI embeddings typically contain many more dimensions.

## Vector Spaces

A vector space is a mathematical environment in which vectors can be represented and compared.

Embedding models map information into a learned vector space.

Information with related meanings may have vectors that are closer together according to a chosen similarity measure.

## Conceptual Example

Imagine a system that processes these concepts:

- Doctor.
- Hospital.
- Patient.
- Automobile.
- Engine.

The embedding model may represent related concepts closer together in its learned vector space.

However, semantic relationships are more complex than simply grouping similar words.

## Dimensions and Relationships

Each vector dimension contributes to the representation.

These dimensions are learned by the model and are not necessarily individually interpretable as human-readable concepts.

## Enterprise Application

A company can convert policy documents into vectors and store them in a vector database.

An employee's question can also be converted into a vector.

The application then searches for documents that are mathematically similar to the question.

## Key Principle

Vectors provide the mathematical foundation for comparing information represented by embedding models.`,
          },
          {
            type: 'check',
            question: "What is a vector in the context of AI embeddings?",
            options: [
              "A single similarity score",
              "A ranked list of keywords",
              "An ordered list of numbers",
              "A table of document IDs",
            ],
            answer: 2,
            explanation: "A vector is an ordered collection of numbers used to represent information mathematically.",
          },
        ],
      },
      {
        id: "semantic-similarity",
        title: "Understanding Semantic Similarity",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# Understanding Semantic Similarity

Semantic similarity measures how closely two pieces of information relate in meaning.

Embedding models make it possible to compare text using numerical representations rather than relying only on exact word matches.

## Keyword Matching vs. Semantic Similarity

Consider these two sentences:

Sentence A:

"How can I change my password?"

Sentence B:

"I need to update my login credentials."

A keyword search may not find many matching words.

However, the sentences express similar ideas.

An embedding-based system may identify their semantic relationship.

## Similarity Scores

A vector database or similarity search algorithm may calculate a score representing how closely two vectors relate.

The interpretation of that score depends on the similarity metric being used.

## Similarity Is Not Truth

A highly similar document is not necessarily correct, current, or authoritative.

For example, an outdated password policy may be semantically similar to a user's question.

The retrieval system should also consider document status, ownership, and freshness.

## Enterprise Example

An employee searches:

"What is the procedure for reporting a security incident?"

The system may retrieve an article titled:

"Information Security Event Reporting Procedure."

The wording differs, but the business meaning is related.

## Practical Considerations

Semantic search should be evaluated using realistic user queries and known relevant documents.

## Key Principle

Semantic similarity helps applications retrieve information based on meaning rather than requiring exact keyword matches.`,
          },
          {
            type: 'check',
            question: "What is a major advantage of semantic search?",
            options: [
              "It can identify related information even when different words are used",
              "It eliminates the need for document management",
              "It guarantees every retrieved document is correct",
              "It requires exact keyword matches",
            ],
            answer: 0,
            explanation: "Semantic search identifies related information based on meaning, even when the wording differs.",
          },
        ],
      },
      {
        id: "embedding-similarity-limitations",
        title: "Limitations of Embedding Representations",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# Limitations of Embedding Representations

Embeddings are powerful, but they have limitations.

Understanding these limitations is important when designing enterprise retrieval systems.

## 1. Ambiguous Language

A word can have multiple meanings.

For example:

"Bank" may refer to a financial institution or the side of a river.

The surrounding context affects how the model represents the information.

## 2. Specialized Terminology

A general embedding model may not perform well on specialized technical or industry terminology.

Organizations should test models against their actual document collections.

## 3. Lost Detail

Converting a document into an embedding does not preserve every detail in a form that can be perfectly reconstructed.

The original document should remain available.

## 4. Similarity Does Not Equal Relevance

Two documents may be mathematically similar but differ in business applicability.

Metadata filtering and additional ranking techniques may be necessary.

## 5. Model Changes

Changing embedding models can change the vector representation.

An application may need to regenerate stored embeddings when migrating to a new model.

## 6. Bias and Representation

Embedding models may reflect limitations or biases in their training data.

Evaluate their behavior using representative and diverse test cases.

## Enterprise Recommendation

Do not rely exclusively on vector similarity.

Combine embeddings with metadata, business rules, access controls, and retrieval evaluation.`,
          },
          {
            type: 'check',
            question: "Why is it important to retain original documents when using embeddings?",
            options: [
              "Vector databases cannot store metadata",
              "Original documents prevent vector searches",
              "Embeddings always contain the complete original document",
              "Embeddings do not preserve every original detail in a reconstructable form",
            ],
            answer: 3,
            explanation: "Embeddings are numerical representations and should not replace the original source documents needed for verification and retrieval.",
          },
        ],
      },
    ],
  },
  {
    id: "similarity-search-and-distance-metrics",
    title: "Similarity Search and Distance Metrics",
    lessons: [
      {
        id: "cosine-similarity",
        title: "Understanding Cosine Similarity",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# Understanding Cosine Similarity

Cosine similarity is a mathematical measure used to compare the orientation of two vectors.

It is commonly used in embedding-based search systems.

## Basic Concept

Cosine similarity measures the cosine of the angle between two vectors.

If two vectors point in similar directions, their cosine similarity is higher.

If they point in very different directions, their similarity is lower.

## Typical Range

For normalized or general real-valued vectors, cosine similarity ranges from:

- -1: Opposite directions.
- 0: Orthogonal directions.
- 1: Same direction.

The practical range depends on the embedding model and the vectors being compared.

## Why It Is Useful

Cosine similarity focuses on the angle between vectors rather than directly measuring their magnitude.

This can be useful when comparing semantic embeddings.

## Example

A user submits:

"How do I reset my account password?"

The application converts the question into a vector.

It compares the query vector with stored document vectors.

Documents with higher cosine similarity may be considered more relevant candidates.

## Important Consideration

A cosine similarity score is not automatically a probability that a document is relevant.

A score of 0.90 does not mean there is a 90% probability that the document is correct.

## Enterprise Application

Cosine similarity can be used in knowledge retrieval systems to identify articles related to employee questions.`,
          },
          {
            type: 'check',
            question: "What does cosine similarity primarily measure?",
            options: [
              "The number of documents in a collection",
              "The size of an embedding model",
              "The angle-based relationship between two vectors",
              "The network latency of an API",
            ],
            answer: 2,
            explanation: "Cosine similarity measures the cosine of the angle between two vectors and is commonly used to compare embeddings.",
          },
        ],
      },
      {
        id: "euclidean-distance-and-dot-product",
        title: "Euclidean Distance and Dot Product",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# Euclidean Distance and Dot Product

Several mathematical methods can be used to compare vectors.

Two important methods are Euclidean distance and dot product.

## Euclidean Distance

Euclidean distance measures the straight-line distance between two points in a vector space.

For two-dimensional points:

A = (1, 2)

B = (4, 6)

The Euclidean distance is:

sqrt((4 - 1)^2 + (6 - 2)^2)

\`sqrt(9 + 16)\`

\`sqrt(25)\` = 5

A smaller distance means the points are closer together.

## Dot Product

The dot product multiplies corresponding vector components and adds the results.

For example:

A = [2, 3]

B = [4, 5]

Dot product:

(2 x 4) + (3 x 5)

8 + 15 = 23

## Comparing the Methods

Cosine similarity focuses on vector direction.

Euclidean distance measures the distance between vectors.

Dot product considers both direction and magnitude.

## Normalization

When vectors are normalized to unit length, dot product and cosine similarity become equivalent.

## Choosing a Metric

The appropriate metric depends on:

- The embedding model.
- Whether vectors are normalized.
- The vector database.
- The retrieval use case.
- Evaluation results.

## Enterprise Principle

Do not assume that one similarity metric is universally best. Test retrieval performance using the actual application data.`,
          },
          {
            type: 'check',
            question: "What does Euclidean distance measure?",
            options: [
              "The number of database records",
              "The straight-line distance between vectors",
              "The number of tokens in a document",
              "The probability of an AI response being correct",
            ],
            answer: 1,
            explanation: "Euclidean distance measures the straight-line distance between two points in a vector space.",
          },
        ],
      },
      {
        id: "nearest-neighbor-search",
        title: "Nearest Neighbor and Approximate Nearest Neighbor Search",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# Nearest Neighbor and Approximate Nearest Neighbor Search

Nearest neighbor search identifies vectors that are closest to a query vector.

It is a fundamental operation in vector databases.

## Exact Nearest Neighbor Search

An exact search compares the query against every vector in the collection.

This can provide exact results according to the selected distance metric.

However, it may become expensive when a collection contains millions or billions of vectors.

## Approximate Nearest Neighbor Search

Approximate Nearest Neighbor (ANN) algorithms reduce search costs by exploring an optimized representation of the vector space.

They aim to find highly relevant candidates without examining every vector.

## Why Approximate Search Matters

Enterprise systems may contain:

- Millions of knowledge chunks.
- Large document repositories.
- Product catalogs.
- Customer records.
- Technical documentation.

Searching every vector for every request may not be practical.

## Common ANN Approaches

Examples include:

- Hierarchical Navigable Small World (HNSW).
- Inverted File Index (IVF).
- Product Quantization (PQ).

Different databases support different indexing strategies.

## Trade-Offs

ANN systems balance:

- Search speed.
- Retrieval quality.
- Memory usage.
- Index construction time.
- Storage requirements.

## Enterprise Example

An organization has five million indexed knowledge chunks.

An employee asks a question.

The vector database uses an ANN index to identify relevant chunks efficiently.

## Key Principle

Approximate nearest neighbor search helps vector databases retrieve similar vectors efficiently at large scale.`,
          },
          {
            type: 'check',
            question: "Why are Approximate Nearest Neighbor algorithms useful?",
            options: [
              "They guarantee every search result is factually correct",
              "They eliminate the need for embeddings",
              "They help retrieve similar vectors efficiently at scale",
              "They replace application authorization",
            ],
            answer: 2,
            explanation: "ANN algorithms reduce search costs by finding highly similar vector candidates without necessarily comparing every stored vector.",
          },
        ],
      },
    ],
  },
  {
    id: "introduction-to-vector-databases",
    title: "Introduction to Vector Databases",
    lessons: [
      {
        id: "what-is-a-vector-database",
        title: "What Is a Vector Database?",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# What Is a Vector Database?

A vector database is a database designed to store, index, and retrieve numerical vectors.

These vectors are commonly generated by embedding models.

Unlike traditional databases that primarily retrieve records using exact values or predefined conditions, vector databases support similarity-based retrieval.

## Why Do We Need Vector Databases?

Imagine an organization with 100,000 knowledge articles.

An employee asks:

"How do I request a replacement laptop?"

A traditional keyword search may look for documents containing the exact words in the question.

A vector database can compare the meaning of the question against the meaning represented by stored document embeddings.

This makes it possible to retrieve related information even when the wording differs.

## What Does a Vector Database Store?

A typical vector record may contain:

- A unique identifier.
- An embedding vector.
- Original text or a reference to the original content.
- Metadata.
- Document identifiers.

Example:

\`\`\`json
{
  "id": "knowledge-article-001",
  "content": "Instructions for requesting replacement hardware.",
  "embedding": [0.21, 0.45, -0.12],
  "metadata": {
    "category": "Hardware",
    "department": "IT"
  }
}
\`\`\`

The vector values are illustrative.

## Common Capabilities

Vector databases typically support:

- Vector storage.
- Similarity search.
- Metadata filtering.
- Nearest neighbor retrieval.
- Index management.
- Data updates and deletion.

## Vector Databases vs. Traditional Databases

Traditional relational databases are excellent for structured records and transactional operations.

Vector databases are optimized for similarity-based retrieval.

Many enterprise architectures use both.

## Enterprise Example

An organization may use:

- ServiceNow to manage incidents and knowledge records.
- A document repository to store original documents.
- A vector database to index document embeddings.
- An AI model to generate answers using retrieved information.

## Key Principle

A vector database makes it practical to search large collections of information using vector similarity.`,
          },
          {
            type: 'check',
            question: "What is the primary purpose of a vector database?",
            options: [
              "To train embedding models on the stored documents",
              "To store vectors and find the most similar ones quickly",
              "To store documents and search them by exact keywords",
              "To join tables of structured business records",
            ],
            answer: 1,
            explanation: "Vector databases store and index embeddings so applications can retrieve semantically similar information.",
          },
        ],
      },
      {
        id: "vector-database-data-model",
        title: "Understanding the Vector Database Data Model",
        minutes: 7,
        blocks: [
          {
            type: 'text',
            text: `# Understanding the Vector Database Data Model

A vector database record commonly contains a vector and additional information that helps identify and retrieve the original content.

## 1. Unique Identifier

Every record should have an identifier.

Example:

"document-chunk-001"

The identifier allows an application to reference, update, or delete the record.

## 2. Embedding

The embedding contains the numerical representation generated by an embedding model.

Example:

[0.12, -0.43, 0.87, 0.31]

Actual embeddings may contain hundreds or thousands of dimensions.

## 3. Content

The original text may be stored directly or referenced through another storage system.

Example:

"Employees can request replacement hardware through the IT service catalog."

## 4. Metadata

Metadata describes the content.

Example:

\`\`\`json
{
  "documentId": "IT-POL-001",
  "department": "IT",
  "category": "Hardware",
  "status": "published",
  "classification": "internal"
}
\`\`\`

Metadata can support filtering and governance.

## 5. Relationships

A document may contain multiple chunks.

Each chunk should retain enough information to identify its original document and location.

For example:

- Document ID.
- Chunk ID.
- Page number.
- Section heading.
- Version.

## Example Record

\`\`\`json
{
  "id": "IT-POL-001-chunk-03",
  "content": "Replacement hardware requests require manager approval.",
  "metadata": {
    "documentId": "IT-POL-001",
    "department": "IT",
    "status": "published",
    "chunkNumber": 3
  },
  "embedding": [0.12, 0.43, -0.21]
}
\`\`\`

## Enterprise Design Consideration

Metadata should be designed before indexing documents.

Poor metadata can make it difficult to enforce access controls, filter results, and trace answers to their original sources.

## Key Principle

A vector record is more useful when it contains both the embedding and the metadata required to manage and retrieve the original information.`,
          },
          {
            type: 'check',
            question: "Why is metadata important in a vector database?",
            options: [
              "It supports filtering, identification, and content management",
              "It automatically encrypts every document",
              "It prevents the need for source documents",
              "It replaces the embedding vector",
            ],
            answer: 0,
            explanation: "Metadata provides descriptive information that helps applications filter, identify, govern, and manage vector records.",
          },
        ],
      },
      {
        id: "vector-database-platforms",
        title: "Exploring Vector Database Platforms",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# Exploring Vector Database Platforms

Several technologies can support vector storage and similarity search.

The right choice depends on the application's scale, architecture, security requirements, and operational model.

## 1. Pinecone

Pinecone is a managed vector database platform designed for vector search applications.

It provides capabilities for storing vectors, indexing them, and retrieving similar records.

## 2. Weaviate

Weaviate is a vector database that supports vector search, metadata filtering, and hybrid retrieval capabilities.

It can be deployed in different environments.

## 3. Milvus

Milvus is an open-source vector database designed for large-scale vector search.

It supports multiple indexing and retrieval approaches.

## 4. Chroma

Chroma is a vector database commonly used in AI development and retrieval applications.

It is frequently used for experimentation and application development.

## 5. PostgreSQL with pgvector

PostgreSQL can support vector similarity search through the pgvector extension.

This option may be attractive when an organization already operates PostgreSQL and wants to combine relational data with vector retrieval.

## 6. Cloud Database Services

Some cloud providers offer vector search capabilities as part of broader database platforms.

These services may simplify integration with existing cloud architecture.

## Choosing a Platform

Evaluate:

- Scale and performance.
- Hosting requirements.
- Integration options.
- Security features.
- Metadata filtering.
- Availability.
- Backup and recovery.
- Cost.
- Operational complexity.

## Enterprise Architecture Consideration

A vector database should be selected as part of the overall application architecture.

Consider how it integrates with identity management, document storage, application services, monitoring, and data governance.

## Key Principle

Do not select a vector database simply because it is popular. Select the platform that satisfies the actual enterprise requirements.`,
          },
          {
            type: 'check',
            question: "Which technology allows PostgreSQL to support vector similarity search?",
            options: [
              "Firebase Hosting",
              "Angular Material",
              "GlideRecord",
              "pgvector",
            ],
            answer: 3,
            explanation: "pgvector is a PostgreSQL extension that adds vector data types and similarity search capabilities.",
          },
        ],
      },
    ],
  },
  {
    id: "vector-database-architecture",
    title: "Vector Database Architecture",
    lessons: [
      {
        id: "vector-indexing-and-storage",
        title: "Vector Indexing and Storage",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# Vector Indexing and Storage

Vector databases use indexing techniques to make similarity search efficient.

Without an index, searching a large vector collection may require comparing a query against every stored vector.

## What Is an Index?

An index is a data structure that helps a database locate relevant records more efficiently.

Traditional databases use indexes for fields such as:

- Employee ID.
- Customer number.
- Email address.
- Record status.

Vector databases use specialized indexes for similarity search.

## HNSW

Hierarchical Navigable Small World (HNSW) is a graph-based approximate nearest neighbor indexing approach.

It organizes vectors into a navigable graph structure.

The search process moves through the graph to identify candidate vectors.

## IVF

Inverted File Index (IVF) divides vectors into clusters.

During search, the algorithm focuses on selected clusters rather than examining every vector.

## Product Quantization

Product Quantization compresses vector representations to reduce memory requirements.

It can be useful for large-scale vector collections.

## Storage Considerations

Vector storage requirements depend on:

- Number of vectors.
- Embedding dimensionality.
- Numerical precision.
- Metadata size.
- Index overhead.
- Replication and backup strategy.

## Example

An organization stores one million document chunks.

Each chunk has an embedding with 1,536 dimensions.

The vector database must manage the vectors, metadata, and search indexes efficiently.

## Architectural Trade-Offs

Indexing approaches involve trade-offs between:

- Retrieval speed.
- Search accuracy.
- Memory usage.
- Index construction time.
- Update performance.

## Key Principle

Vector indexing allows applications to perform similarity searches efficiently as the volume of stored embeddings increases.`,
          },
          {
            type: 'check',
            question: "What is the primary purpose of a vector index?",
            options: [
              "To authenticate application users",
              "To replace document metadata",
              "To improve the efficiency of similarity searches",
              "To generate AI responses",
            ],
            answer: 2,
            explanation: "Vector indexes organize embeddings to make similarity searches more efficient.",
          },
        ],
      },
      {
        id: "metadata-filtering-and-hybrid-search",
        title: "Metadata Filtering and Hybrid Search",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# Metadata Filtering and Hybrid Search

Vector similarity is powerful, but it is not always sufficient by itself.

Metadata filtering and hybrid search help improve retrieval quality.

## Metadata Filtering

Metadata filtering restricts the search to records that satisfy specified conditions.

Example:

An employee asks:

"How do I request a replacement laptop?"

The application may restrict retrieval to:

\`\`\`json
{
  "department": "IT",
  "status": "published",
  "classification": "internal"
}
\`\`\`

The database searches within the eligible records.

## Why Filtering Matters

Filtering can help enforce:

- Department boundaries.
- Document status.
- Content categories.
- Geographic restrictions.
- Document versions.
- User access permissions.

However, filtering must be based on trusted application authorization decisions.

Do not allow an AI model to decide which confidential records a user can access.

## Hybrid Search

Hybrid search combines multiple retrieval techniques.

A common approach combines:

1. Keyword or lexical search.
2. Vector similarity search.

Keyword search is useful for exact terms.

Vector search is useful for semantic relationships.

## Example

A user searches for:

"Policy SEC-104 password requirements."

Keyword search can locate the exact policy identifier.

Vector search can identify related content about password requirements.

Combining the results may improve retrieval.

## Result Ranking

The application can combine retrieval signals and rerank candidate documents.

The ranking strategy should be evaluated against realistic queries.

## Enterprise Principle

Use vector search for semantic relevance, metadata filtering for controlled scope, and keyword search when exact terms matter.`,
          },
          {
            type: 'check',
            question: "What is the primary advantage of hybrid search?",
            options: [
              "It automatically grants access to restricted documents",
              "It combines different retrieval approaches, such as keyword and vector search",
              "It replaces the embedding model",
              "It eliminates the need for document metadata",
            ],
            answer: 1,
            explanation: "Hybrid search combines lexical and semantic retrieval signals to improve the identification of relevant information.",
          },
        ],
      },
      {
        id: "vector-database-scalability",
        title: "Vector Database Scalability and Operations",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# Vector Database Scalability and Operations

Enterprise vector databases must support reliable operation as data volume and user demand increase.

## Scalability

Scalability describes a system's ability to handle increasing workloads.

A vector retrieval system may need to support:

- More documents.
- More embeddings.
- More simultaneous users.
- Higher search volume.
- Larger metadata collections.

## Horizontal Scaling

Horizontal scaling adds additional machines or service instances.

Some vector database platforms support distributed architectures that spread storage and query processing across multiple nodes.

## Vertical Scaling

Vertical scaling increases the resources available to an existing server.

Examples include:

- More memory.
- More CPU.
- Faster storage.

## Performance Monitoring

Monitor:

- Query latency.
- Throughput.
- Search accuracy.
- Index utilization.
- Memory consumption.
- Storage consumption.
- Error rates.

## Data Lifecycle Management

Vector records must be maintained as source documents change.

A lifecycle process should address:

- New documents.
- Updated documents.
- Deleted documents.
- Expired documents.
- Re-embedding.
- Index maintenance.

## Backup and Recovery

Organizations should define:

- Backup frequency.
- Recovery objectives.
- Replication strategy.
- Disaster recovery procedures.
- Data retention requirements.

## Enterprise Example

A company updates its employee security policy.

The retrieval system must ensure that the previous policy version is no longer returned as authoritative content.

This requires document lifecycle management, not just vector insertion.

## Key Principle

A production vector database is an operational enterprise service that requires monitoring, maintenance, security, and recovery planning.`,
          },
          {
            type: 'check',
            question: "Why is document lifecycle management important for vector databases?",
            options: [
              "It ensures that outdated or deleted content is handled appropriately",
              "It eliminates database backups",
              "It automatically trains the embedding model",
              "It prevents users from performing searches",
            ],
            answer: 0,
            explanation: "Vector records must be updated or removed when source documents change, expire, or are deleted.",
          },
        ],
      },
    ],
  },
  {
    id: "document-processing-and-chunking",
    title: "Document Processing and Chunking",
    lessons: [
      {
        id: "document-ingestion",
        title: "Document Ingestion for AI Retrieval",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# Document Ingestion for AI Retrieval

Document ingestion is the process of bringing information into an AI retrieval system.

Before documents can be searched semantically, they usually need to be extracted, cleaned, divided into manageable sections, and converted into embeddings.

## Common Document Sources

Enterprise document sources include:

- PDF files.
- Word documents.
- HTML pages.
- Knowledge articles.
- Database records.
- Internal wikis.
- SharePoint repositories.
- ServiceNow knowledge bases.

## Typical Ingestion Workflow

1. Identify an approved source.
2. Retrieve the document.
3. Extract the content.
4. Clean and normalize the text.
5. Divide the content into chunks.
6. Generate embeddings.
7. Store vectors and metadata.
8. Make the content available for retrieval.

## Document Extraction

Documents may contain more than plain text.

They may include:

- Tables.
- Images.
- Headers.
- Footnotes.
- Page numbers.
- Formatted sections.

Extraction tools should preserve relevant structure whenever possible.

## Cleaning

Cleaning may involve:

- Removing repeated headers.
- Removing irrelevant formatting.
- Correcting extraction artifacts.
- Normalizing whitespace.
- Identifying empty content.

## Metadata

Capture useful document information.

Examples:

- Document ID.
- Title.
- Author.
- Department.
- Publication date.
- Version.
- Classification.
- Source location.

## Enterprise Example

A company wants employees to search its HR policies.

The ingestion system retrieves approved HR documents, extracts the text, records metadata, and prepares the content for embedding.

## Key Principle

Good retrieval starts with high-quality source documents and a controlled ingestion process.`,
          },
          {
            type: 'check',
            question: "What is document ingestion?",
            options: [
              "The process of training every language model",
              "The process of bringing and preparing information for an AI retrieval system",
              "The process of replacing the original document repository",
              "The process of deleting source documents",
            ],
            answer: 1,
            explanation: "Document ingestion prepares information from approved sources so it can be indexed and retrieved by an AI application.",
          },
        ],
      },
      {
        id: "document-chunking-strategies",
        title: "Document Chunking Strategies",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# Document Chunking Strategies

Document chunking divides large documents into smaller sections.

These sections are commonly called chunks.

Each chunk can be converted into an embedding and indexed separately.

## Why Chunk Documents?

Large documents may contain multiple topics.

Embedding an entire document can make it difficult to retrieve the specific information needed to answer a question.

Smaller chunks can provide more focused retrieval.

## Fixed-Size Chunking

Fixed-size chunking divides content into sections based on a predefined number of characters or tokens.

Example:

- Chunk 1: Tokens 1–500.
- Chunk 2: Tokens 501–1000.
- Chunk 3: Tokens 1001–1500.

This approach is relatively simple.

However, it may split sentences or related paragraphs.

## Recursive Chunking

Recursive chunking attempts to divide text using structural boundaries.

For example:

1. Documents.
2. Sections.
3. Paragraphs.
4. Sentences.

This helps preserve meaningful content boundaries.

## Semantic Chunking

Semantic chunking uses meaning and context to identify suitable boundaries.

Related sentences may be kept together.

## Chunk Size Trade-Offs

Very small chunks may lack sufficient context.

Very large chunks may contain unrelated information and reduce retrieval precision.

## Enterprise Example

An employee handbook contains 200 pages.

Instead of embedding the entire handbook as one record, the ingestion pipeline divides it into meaningful sections such as:

- Leave policy.
- Benefits.
- Employee conduct.
- Remote work.
- Performance management.

## Key Principle

Choose a chunking strategy that preserves useful meaning while supporting accurate and efficient retrieval.`,
          },
          {
            type: 'check',
            question: "What is the purpose of document chunking?",
            options: [
              "To increase the number of model parameters",
              "To divide large documents into smaller retrievable sections",
              "To remove all document metadata",
              "To encrypt all document content",
            ],
            answer: 1,
            explanation: "Chunking divides large documents into smaller sections that can be embedded and retrieved more precisely.",
          },
        ],
      },
      {
        id: "chunk-overlap-and-metadata",
        title: "Chunk Overlap and Metadata Preservation",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# Chunk Overlap and Metadata Preservation

Chunking can introduce problems when important context appears at the boundary between two sections.

Overlap helps reduce this problem.

## What Is Chunk Overlap?

Chunk overlap repeats a portion of one chunk in the next chunk.

Example:

- **Chunk 1:** Tokens 1–500.
- **Chunk 2:** Tokens 450–950.

The second chunk repeats the final 50 tokens of the first chunk.

This preserves some continuity between adjacent sections.

## Benefits

Overlap can help:

- Preserve context.
- Reduce boundary-related information loss.
- Improve retrieval of related passages.

## Trade-Offs

Too much overlap increases:

- Storage consumption.
- Embedding generation costs.
- Duplicate retrieval results.

Overlap should be selected based on document structure and evaluation results.

## Metadata Preservation

Each chunk should retain information about its source.

Useful metadata includes:

- Document ID.
- Document title.
- Chunk number.
- Section heading.
- Page number.
- Source URL or record reference.
- Publication status.
- Access classification.

## Why Metadata Matters

When an AI assistant generates an answer, the application should be able to identify the source material.

This supports:

- Citations.
- Traceability.
- Document version control.
- Access enforcement.
- Auditability.

## Enterprise Example

A RAG assistant answers an employee's question using a company policy.

The response should identify the policy title and relevant section.

This is possible only if the retrieval system preserves source information.

## Key Principle

Chunking should preserve both meaningful content and the metadata needed to trace each result back to its source.`,
          },
          {
            type: 'check',
            question: "What is a major purpose of chunk overlap?",
            options: [
              "To eliminate metadata",
              "To prevent vector searches",
              "To increase the embedding model's dimensions",
              "To preserve context between adjacent chunks",
            ],
            answer: 3,
            explanation: "Overlap repeats some content between neighboring chunks to reduce context loss at chunk boundaries.",
          },
        ],
      },
    ],
  },
  {
    id: "introduction-to-retrieval-augmented-generation",
    title: "Introduction to Retrieval-Augmented Generation",
    lessons: [
      {
        id: "what-is-rag",
        title: "What Is Retrieval-Augmented Generation?",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# What Is Retrieval-Augmented Generation?

Retrieval-Augmented Generation (RAG) is an architecture that combines information retrieval with language model generation.

Instead of relying only on information learned during model training, a RAG application retrieves relevant information from external sources and provides it to the model as context.

## Why Is RAG Important?

Organizations often have information that general-purpose language models do not know.

Examples include:

- Internal policies.
- Company procedures.
- Product documentation.
- Customer support articles.
- Technical manuals.
- Enterprise knowledge bases.

RAG makes it possible to use this information when generating responses.

## Basic RAG Workflow

1. A user submits a question.
2. The application converts the question into an embedding.
3. The retrieval system searches for relevant document chunks.
4. The application selects relevant results.
5. The retrieved content is added to the model prompt.
6. The language model generates a response using the supplied context.
7. The application returns the response and supporting references.

## Example

User question:

"What is the company's remote work policy?"

The retrieval system searches approved HR documents.

It retrieves the relevant policy sections.

The language model uses those sections to formulate an answer.

## RAG vs. Traditional Model Responses

Without RAG, the model relies on its learned knowledge and supplied prompt context.

With RAG, the application supplies relevant external information at request time.

## RAG Does Not Guarantee Accuracy

The model can still misunderstand retrieved information or generate unsupported claims.

The application should validate retrieval quality and encourage source-grounded responses.

## Enterprise Applications

RAG is useful for:

- Internal knowledge assistants.
- Policy search.
- Technical support.
- Customer service.
- Compliance research.
- Enterprise documentation.

## Key Principle

RAG connects language models to relevant external knowledge at the time a question is answered.`,
          },
          {
            type: 'check',
            question: "What distinguishes RAG from a language model that only uses its existing learned knowledge?",
            options: [
              "RAG retrieves external information and supplies it as context",
              "RAG eliminates all model errors",
              "RAG automatically retrains the model for every question",
              "RAG requires no language model",
            ],
            answer: 0,
            explanation: "RAG retrieves relevant external information and provides it to the model to support response generation.",
          },
        ],
      },
      {
        id: "rag-architecture-components",
        title: "Core Components of a RAG Architecture",
        minutes: 9,
        blocks: [
          {
            type: 'text',
            text: `# Core Components of a RAG Architecture

A RAG application consists of several components that work together.

## 1. Data Sources

These provide the information used by the application.

Examples:

- PDFs.
- Knowledge articles.
- Databases.
- Internal websites.
- Document repositories.

## 2. Ingestion Pipeline

The ingestion pipeline retrieves, extracts, cleans, and prepares source documents.

## 3. Embedding Model

The embedding model converts document chunks into numerical vectors.

It also converts user questions into compatible vectors.

## 4. Vector Database

The vector database stores embeddings and supports similarity search.

## 5. Retrieval Service

The retrieval service identifies relevant content based on the user's question and applicable filters.

## 6. Language Model

The language model uses the retrieved information to generate a response.

## 7. Application Layer

The application manages:

- User authentication.
- Authorization.
- Prompt construction.
- Model communication.
- Response validation.
- User interface.
- Logging.

## Architecture Flow

\`\`\`text
Data Sources
    |
    v
Ingestion Pipeline
    |
    v
Document Chunking
    |
    v
Embedding Model
    |
    v
Vector Database

User Question
    |
    v
Application
    |
    v
Query Embedding
    |
    v
Retrieval Service
    |
    v
Relevant Documents
    |
    v
Language Model
    |
    v
Response
\`\`\`

## Enterprise Architecture Consideration

The retrieval service must enforce access restrictions before information is passed to the language model.

Do not assume that the model can safely determine which documents a user is allowed to access.

## Key Principle

RAG is a complete application architecture, not simply a connection between an LLM and a vector database.`,
          },
          {
            type: 'check',
            question: "Which component is responsible for converting documents and queries into numerical vectors?",
            options: [
              "Authentication service",
              "Embedding model",
              "User interface",
              "Audit log",
            ],
            answer: 1,
            explanation: "The embedding model converts document content and user queries into numerical vectors for similarity-based retrieval.",
          },
        ],
      },
      {
        id: "rag-vs-fine-tuning",
        title: "RAG vs. Fine-Tuning",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# RAG vs. Fine-Tuning

RAG and fine-tuning are two different approaches to adapting AI applications.

They solve different problems.

## Retrieval-Augmented Generation

RAG provides external information to a model at request time.

It is useful when an application needs access to:

- Current documentation.
- Internal company policies.
- Frequently updated information.
- Private organizational knowledge.

The underlying model does not need to be retrained every time a document changes.

## Fine-Tuning

Fine-tuning involves additional training of a pretrained model using a selected dataset.

It can help adapt model behavior for specific tasks, formats, or domains.

Examples include:

- Specialized classification behavior.
- Domain-specific response patterns.
- Consistent output styles.
- Task-specific language generation.

## Comparison

RAG:

- Retrieves external information.
- Supports frequently changing knowledge.
- Can provide source references.
- Requires a retrieval architecture.

Fine-tuning:

- Changes model behavior through additional training.
- Requires preparation of training examples.
- Involves training and evaluation processes.
- Does not automatically provide access to current private documents.

## Can They Be Combined?

Yes.

An enterprise application may use a fine-tuned model together with a RAG retrieval pipeline.

The model can have specialized behavior while still receiving relevant external knowledge.

## Example

A bank wants an AI assistant that understands its internal terminology and retrieves current lending policies.

RAG can provide current policy content.

Fine-tuning may be considered if the organization also needs specialized model behavior that prompting alone does not adequately achieve.

## Key Principle

Use RAG when the application needs external knowledge at request time. Consider fine-tuning when the model's behavior itself needs additional adaptation.`,
          },
          {
            type: 'check',
            question: "Which approach is generally more appropriate when an AI application needs access to frequently updated company policies?",
            options: [
              "RAG",
              "Increasing the browser cache",
              "Fine-tuning alone",
              "Replacing the database with prompts",
            ],
            answer: 0,
            explanation: "RAG can retrieve updated policy documents at request time without requiring the model to be retrained whenever the documents change.",
          },
        ],
      },
    ],
  },
  {
    id: "building-a-rag-pipeline",
    title: "Building a RAG Pipeline",
    lessons: [
      {
        id: "query-processing-and-retrieval",
        title: "Query Processing and Retrieval",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# Query Processing and Retrieval

Query processing is the stage where a user's question is prepared for retrieval.

In a RAG application, the system must identify relevant information before asking the language model to generate an answer.

## Step 1: Receive the User Query

Example:

"What is the company's process for reporting a cybersecurity incident?"

The application receives the question from an authenticated user.

## Step 2: Validate the Query

The application should check:

- The user is authenticated.
- The query is not empty.
- The query length is within acceptable limits.
- The request complies with application policies.

## Step 3: Generate a Query Embedding

The embedding model converts the question into a numerical vector.

The vector must be compatible with the embeddings stored in the vector database.

## Step 4: Retrieve Relevant Documents

The vector database searches for document chunks that are similar to the query.

The application may also apply metadata filters.

For example:

- Document status must be published.
- Department must be Cybersecurity.
- Document classification must be accessible to the user.

## Step 5: Rank the Results

The application selects the most relevant results for the next stage.

It may use similarity scores, keyword relevance, metadata, or a reranking model.

## Step 6: Prepare the Context

The selected document chunks are organized into context that will be supplied to the language model.

## Enterprise Consideration

Authorization must happen before restricted information is passed to the model.

A retrieval system should never rely on the language model to decide whether a user can access a document.

## Key Principle

Query processing connects the user's question to the relevant information stored in the retrieval system.`,
          },
          {
            type: 'check',
            question: "What happens after a user query is converted into an embedding?",
            options: [
              "The application automatically publishes a document",
              "The model is retrained",
              "The retrieval system searches for similar document vectors",
              "The user's permissions are automatically increased",
            ],
            answer: 2,
            explanation: "The query embedding is compared against stored document embeddings to identify relevant content.",
          },
        ],
      },
      {
        id: "context-construction-and-generation",
        title: "Context Construction and Response Generation",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# Context Construction and Response Generation

After retrieving relevant documents, the application must prepare the information for the language model.

This process is called context construction.

## What Is Context Construction?

Context construction organizes retrieved information into a format that the model can use when answering a question.

The application may include:

- The user's question.
- Relevant document excerpts.
- Document titles.
- Source references.
- Instructions about how to use the information.

## Example

User question:

"What is the process for requesting a replacement laptop?"

Retrieved information:

"Employees must submit a hardware replacement request through the IT service catalog. Manager approval is required."

The application places this information into the model's prompt.

## Example Prompt

"You are an enterprise IT support assistant.

Answer the user's question using only the supplied reference information.

If the reference information does not contain the answer, explain that the information is unavailable.

- **User question:** What is the process for requesting a replacement laptop?
- **Reference information:** Employees must submit a hardware replacement request through the IT service catalog. Manager approval is required.

Include the document source in your response."

## Response Generation

The language model uses the question and retrieved information to generate a response.

## Source Attribution

The application should retain document identifiers and other source metadata so it can display references.

## Context Limits

The model has a maximum context window.

The application must manage how much retrieved content is supplied.

Too much context can increase cost, latency, and irrelevant information.

## Enterprise Recommendation

Retrieve enough relevant information to answer the question, but avoid sending unnecessary documents to the model.`,
          },
          {
            type: 'check',
            question: "What is the purpose of context construction in RAG?",
            options: [
              "To replace document storage",
              "To organize retrieved information for the language model",
              "To permanently retrain the model",
              "To remove authentication requirements",
            ],
            answer: 1,
            explanation: "Context construction prepares the retrieved information and user question for the language model.",
          },
        ],
      },
      {
        id: "end-to-end-rag-pipeline",
        title: "Understanding the End-to-End RAG Pipeline",
        minutes: 10,
        blocks: [
          {
            type: 'text',
            text: `# Understanding the End-to-End RAG Pipeline

A RAG pipeline combines document ingestion, embedding generation, retrieval, and language model generation.

## Ingestion Pipeline

The ingestion process prepares documents before users search them.

1. Retrieve approved documents.
2. Extract document content.
3. Clean and normalize text.
4. Divide documents into chunks.
5. Generate embeddings.
6. Store vectors and metadata.
7. Maintain document versions.

## Query Pipeline

The query process runs when a user asks a question.

1. Authenticate the user.
2. Validate the question.
3. Generate a query embedding.
4. Retrieve relevant document chunks.
5. Apply authorization and metadata filters.
6. Rank the retrieved results.
7. Construct the model context.
8. Generate the response.
9. Validate the response.
10. Return the answer and sources.

## Architecture Example

\`\`\`text
Document Repository
    |
    v
Document Ingestion
    |
    v
Text Extraction
    |
    v
Chunking
    |
    v
Embedding Model
    |
    v
Vector Database

User
    |
    v
Application API
    |
    v
Authentication and Authorization
    |
    v
Query Embedding
    |
    v
Retrieval
    |
    v
Context Construction
    |
    v
Language Model
    |
    v
Response Validation
    |
    v
User Interface
\`\`\`

## Failure Handling

A production RAG application should handle:

- Unavailable document sources.
- Embedding provider errors.
- Vector database failures.
- Empty retrieval results.
- Invalid model responses.
- Timeouts.
- Unauthorized document access.

## Enterprise Design Consideration

The ingestion pipeline and query pipeline are separate workflows.

Ingestion prepares knowledge for retrieval.

The query pipeline retrieves and uses that knowledge to answer questions.

## Key Principle

A successful RAG application requires reliable coordination between all pipeline components.`,
          },
          {
            type: 'check',
            question: "What is the difference between the ingestion pipeline and the query pipeline?",
            options: [
              "Both prepare documents, but only ingestion uses embeddings",
              "Ingestion trains the model; the query pipeline stores documents",
              "Ingestion answers questions; the query pipeline prepares documents",
              "Ingestion prepares documents; the query pipeline answers questions",
            ],
            answer: 3,
            explanation: "The ingestion pipeline prepares and indexes documents, while the query pipeline retrieves relevant information when a user submits a question.",
          },
        ],
      },
    ],
  },
  {
    id: "advanced-retrieval-techniques",
    title: "Advanced Retrieval Techniques",
    lessons: [
      {
        id: "query-expansion-and-rewriting",
        title: "Query Expansion and Query Rewriting",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# Query Expansion and Query Rewriting

Users do not always ask questions using the terminology found in enterprise documents.

Query expansion and rewriting help improve retrieval by transforming the original question.

## Query Rewriting

Query rewriting reformulates a question to make it clearer or more suitable for retrieval.

Original:

"How do I get a new computer?"

Rewritten:

"What is the procedure for requesting replacement employee hardware?"

The rewritten question may align more closely with organizational terminology.

## Query Expansion

Query expansion adds related terms or alternative expressions.

Original:

"Password reset"

Expanded terms:

- Account recovery.
- Forgotten password.
- Credential reset.
- Login access.

The retrieval system can use these alternatives to find additional relevant documents.

## Multi-Query Retrieval

An application may generate multiple search queries from one user question.

It searches using the different queries and combines the results.

This can improve coverage when the original question is ambiguous.

## Risks

Query rewriting can change the user's intended meaning.

It may also introduce terms that are not relevant.

The application should preserve the original question and evaluate the quality of rewritten queries.

## Enterprise Example

A user asks:

"How do I get access to the finance application?"

The system may rewrite the question using approved terminology such as:

"Finance application access request and user provisioning procedure."

## Key Principle

Query expansion and rewriting can improve retrieval coverage, but the transformed query must preserve the user's original intent.`,
          },
          {
            type: 'check',
            question: "What is the primary purpose of query rewriting?",
            options: [
              "To retrain the embedding model",
              "To delete the original question",
              "To reformulate a question to improve retrieval",
              "To bypass document authorization",
            ],
            answer: 2,
            explanation: "Query rewriting reformulates the original question to help the retrieval system identify relevant information.",
          },
        ],
      },
      {
        id: "reranking-and-retrieval-quality",
        title: "Reranking and Retrieval Quality",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# Reranking and Retrieval Quality

Initial vector retrieval identifies candidate documents.

However, the first retrieval results may not always be the most useful documents for answering the question.

Reranking provides an additional relevance evaluation step.

## How Reranking Works

A typical workflow is:

1. Generate a query embedding.
2. Retrieve an initial set of candidate chunks.
3. Evaluate the candidates using a reranking model or another ranking method.
4. Reorder the results.
5. Select the best candidates for context construction.

## Example

An employee asks:

"What is the approval process for purchasing a laptop?"

Initial retrieval returns:

1. General hardware inventory policy.
2. Laptop purchase approval procedure.
3. Employee equipment return policy.
4. Hardware maintenance instructions.

A reranker may identify the laptop purchase approval procedure as the most relevant result.

## Why Reranking Helps

It can improve:

- Relevance.
- Retrieval precision.
- Context quality.
- Answer usefulness.

## Retrieval Metrics

Common retrieval evaluation metrics include:

### Precision

How many retrieved results are relevant?

### Recall

How many of the relevant documents were successfully retrieved?

### Mean Reciprocal Rank

How highly ranked is the first relevant result?

### Normalized Discounted Cumulative Gain

How well are relevant results ordered across the result list?

## Trade-Offs

Reranking adds processing time and potentially additional cost.

It should be used when the improvement in retrieval quality justifies the additional overhead.

## Key Principle

Retrieval quality is not determined only by finding similar vectors. Ranking the most useful results is equally important.`,
          },
          {
            type: 'check',
            question: "What is the primary purpose of reranking in a RAG pipeline?",
            options: [
              "To remove the original documents",
              "To replace document ingestion",
              "To reorder retrieved candidates based on relevance",
              "To create new user accounts",
            ],
            answer: 2,
            explanation: "Reranking evaluates candidate results and reorders them so the most relevant content can be selected.",
          },
        ],
      },
      {
        id: "parent-child-and-multi-stage-retrieval",
        title: "Parent-Child and Multi-Stage Retrieval",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# Parent-Child and Multi-Stage Retrieval

Some retrieval systems use multiple document representations to balance precision and context.

## Parent-Child Retrieval

Parent-child retrieval divides documents into larger sections and smaller chunks.

The smaller chunks are used for precise retrieval.

When a small chunk is selected, the application may retrieve its larger parent section to provide additional context.

## Example

An employee handbook contains a section titled:

"Employee Leave Policy"

The section contains several paragraphs.

The application creates smaller child chunks for:

- Annual leave.
- Sick leave.
- Parental leave.
- Leave approval.

A query about parental leave retrieves the relevant child chunk.

The application may then supply the entire parent section to provide additional context.

## Benefits

This approach can provide:

- More precise retrieval.
- Better contextual information.
- Improved document organization.

## Multi-Stage Retrieval

A multi-stage retrieval process applies different techniques in sequence.

Example:

1. Filter documents by authorization.
2. Perform vector search.
3. Apply keyword search.
4. Rerank candidates.
5. Select relevant context.

## Enterprise Application

A large organization may maintain technical manuals containing hundreds of pages.

A multi-stage retrieval system can identify the relevant subsection while preserving enough surrounding context for the model to answer correctly.

## Important Consideration

Retrieving a parent document must not bypass access controls.

The application must verify that the user can access the complete content being supplied to the model.

## Key Principle

Advanced retrieval techniques balance precise matching with sufficient context.`,
          },
          {
            type: 'check',
            question: "What is the main advantage of parent-child retrieval?",
            options: [
              "It ranks documents by how recently their parent was updated",
              "It stores each document twice so retrieval keeps working during outages",
              "It removes the need for metadata filters by grouping related chunks",
              "It matches small chunks precisely, then supplies the larger parent context",
            ],
            answer: 3,
            explanation: "Parent-child retrieval can use smaller chunks for precise matching while retrieving a larger section to preserve context.",
          },
        ],
      },
    ],
  },
  {
    id: "rag-security-evaluation-and-optimization",
    title: "RAG Security, Evaluation, and Optimization",
    lessons: [
      {
        id: "rag-security-and-access-control",
        title: "RAG Security and Access Control",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# RAG Security and Access Control

Enterprise RAG systems may process confidential organizational information.

Security must be enforced throughout the ingestion and retrieval workflows.

## 1. Authentication

The application must identify the user making the request.

## 2. Authorization

The application must determine which documents the user is allowed to access.

## 3. Document-Level Access Control

Documents may have different access requirements.

Examples:

- Public.
- Internal.
- Confidential.
- Restricted.

The retrieval system must enforce the applicable permissions.

## 4. Metadata Filtering

Trusted authorization decisions can be translated into retrieval filters.

For example, an employee may be permitted to retrieve documents belonging to their department.

The filter must be constructed by the application, not trusted from user-supplied instructions.

## 5. Tenant Isolation

In a multi-tenant platform, one organization's information must not be exposed to another organization.

Possible architectural controls include:

- Separate indexes.
- Tenant-specific namespaces.
- Mandatory organization filters.
- Server-side tenant resolution.
- Database security rules.

The appropriate design depends on the vector database and the overall security architecture.

## 6. Data Protection

Consider:

- Encryption in transit.
- Encryption at rest.
- Credential management.
- Data retention.
- Logging.
- Provider data handling.

## 7. Prompt Injection

Retrieved documents may contain malicious instructions.

Treat retrieved content as untrusted data and validate any requested tool actions independently.

## Enterprise Example

A company has separate HR and Finance departments.

An HR employee should not receive confidential Finance documents merely because those documents are semantically similar to the employee's question.

## Key Principle

Authorization must be enforced before restricted content reaches the language model.`,
          },
          {
            type: 'check',
            question: "Where should document access authorization be enforced in an enterprise RAG system?",
            options: [
              "In the system prompt, by telling the model which documents to ignore",
              "In the user interface, by hiding answers the user should not see",
              "After generation, by removing restricted facts from the response",
              "In trusted retrieval controls, before restricted content reaches the model",
            ],
            answer: 3,
            explanation: "The application must enforce document permissions before retrieving and supplying restricted information to the language model.",
          },
        ],
      },
      {
        id: "evaluating-rag-quality",
        title: "Evaluating RAG Quality",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# Evaluating RAG Quality

A RAG application must be evaluated at both the retrieval and generation stages.

A response may be poor because the wrong information was retrieved or because the model incorrectly interpreted the retrieved content.

## Retrieval Evaluation

Evaluate whether the system retrieves relevant information.

Common metrics include:

- Precision.
- Recall.
- Mean Reciprocal Rank.
- Normalized Discounted Cumulative Gain.

## Generation Evaluation

Evaluate whether the generated response is useful and supported by the retrieved information.

Consider:

- Faithfulness.
- Answer relevance.
- Completeness.
- Citation accuracy.
- Correct handling of missing information.

## Groundedness

Groundedness measures whether the answer is supported by the supplied source information.

A grounded response should not introduce unsupported claims.

## Test Dataset

Create a collection of representative questions with known relevant documents and expected answers.

Example:

- **Question:** "What is the company's laptop replacement procedure?"
- **Expected source:** "IT Hardware Replacement Policy."
- **Expected answer:** Employees submit a hardware replacement request through the IT service catalog and obtain manager approval.

## Human Evaluation

Business specialists should review results for important enterprise workflows.

Automated metrics are useful but do not replace expert judgment.

## Continuous Evaluation

Evaluate the system after:

- Changing the embedding model.
- Updating chunking strategies.
- Modifying retrieval filters.
- Changing prompts.
- Switching language models.
- Updating source documents.

## Key Principle

Measure retrieval quality and answer quality separately so problems can be identified and corrected.`,
          },
          {
            type: 'check',
            question: "Why should retrieval and generation be evaluated separately?",
            options: [
              "Because poor answers can result from either incorrect retrieval or incorrect generation",
              "Because vector databases generate all final answers",
              "Because retrieval and generation are identical operations",
              "Because evaluation is unnecessary for production systems",
            ],
            answer: 0,
            explanation: "Separate evaluation helps identify whether a problem originates from retrieving the wrong information or generating an incorrect response.",
          },
        ],
      },
      {
        id: "rag-performance-and-cost-optimization",
        title: "RAG Performance and Cost Optimization",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# RAG Performance and Cost Optimization

Enterprise RAG systems must balance retrieval quality, response speed, scalability, and operating costs.

## 1. Optimize Document Chunking

Poor chunk sizes can increase the number of irrelevant retrieval results.

Evaluate chunk sizes and overlap using representative documents.

## 2. Optimize Retrieval

Use appropriate:

- Vector indexes.
- Metadata filters.
- Similarity thresholds.
- Candidate limits.
- Reranking strategies.

## 3. Reduce Unnecessary Context

Sending too much retrieved information increases token consumption and may introduce irrelevant details.

Select only useful context.

## 4. Caching

Applications may cache frequently requested information or query results where appropriate.

Cache invalidation is important when source documents or access permissions change.

## 5. Model Selection

A smaller model may be sufficient for simple summarization tasks.

More complex questions may require a more capable model.

Evaluate quality before making cost-driven changes.

## 6. Asynchronous Ingestion

Document processing can be performed in background jobs rather than blocking user requests.

This helps separate document preparation from interactive retrieval.

## 7. Monitoring

Track:

- End-to-end response time.
- Retrieval latency.
- Model latency.
- Token usage.
- Embedding costs.
- Error rates.
- Cache hit rate.

## Enterprise Consideration

Optimization should not weaken authorization, data isolation, or answer quality.

## Key Principle

A successful RAG system is not simply accurate. It must also be operationally efficient, secure, and affordable.`,
          },
          {
            type: 'check',
            question: "What is one way to reduce unnecessary model token consumption in a RAG application?",
            options: [
              "Select only relevant retrieved context",
              "Disable retrieval filtering",
              "Send every document to the model",
              "Increase chunk overlap without evaluation",
            ],
            answer: 0,
            explanation: "Selecting only relevant retrieved context reduces unnecessary tokens and can improve response quality.",
          },
        ],
      },
    ],
  },
  {
    id: "practical-enterprise-rag-project",
    title: "Practical Enterprise RAG Project",
    lessons: [
      {
        id: "designing-an-enterprise-knowledge-assistant",
        title: "Designing an Enterprise Knowledge Assistant",
        minutes: 9,
        blocks: [
          {
            type: 'text',
            text: `# Designing an Enterprise Knowledge Assistant

In this lesson, you will design a RAG-based enterprise knowledge assistant.

## Business Scenario

A large organization maintains thousands of internal documents.

Employees struggle to find the correct information across:

- HR policies.
- IT procedures.
- Security documentation.
- Procurement policies.
- Technical manuals.

The organization wants a knowledge assistant that can answer employee questions using approved documentation.

## Functional Requirements

The assistant should:

1. Accept employee questions.
2. Search approved knowledge sources.
3. Retrieve relevant document sections.
4. Generate answers using retrieved information.
5. Display source references.
6. Identify when information is unavailable.

## Security Requirements

The assistant must:

- Authenticate employees.
- Enforce document access permissions.
- Isolate organizational information.
- Protect confidential content.
- Log relevant application activity.

## Proposed Architecture

\`\`\`text
Employee
    |
    v
Angular Application
    |
    v
Backend API
    |
    v
Authentication and Authorization
    |
    v
Query Processing
    |
    v
Embedding Model
    |
    v
Vector Database
    |
    v
Relevant Documents
    |
    v
Language Model
    |
    v
Validated Answer
    |
    v
Employee
\`\`\`

## Supporting Services

The architecture also needs:

- Document repository.
- Ingestion pipeline.
- Text extraction.
- Chunking service.
- Embedding service.
- Monitoring.
- Audit logging.

## Design Decisions

Before implementing the solution, decide:

- Which document sources are approved?
- Which embedding model will be used?
- Which vector database is appropriate?
- How will access permissions be enforced?
- How will source citations be displayed?
- How will outdated documents be removed?

## Key Principle

An enterprise knowledge assistant should retrieve trusted information while respecting organizational access controls.`,
          },
          {
            type: 'check',
            question: "What is a critical requirement for an enterprise knowledge assistant?",
            options: [
              "Every employee must access every document",
              "The application must enforce document-level access permissions",
              "The AI model must control all user permissions",
              "Source references should always be removed",
            ],
            answer: 1,
            explanation: "Enterprise knowledge assistants must enforce access permissions so users only receive information they are authorized to access.",
          },
        ],
      },
      {
        id: "implementing-an-enterprise-rag-workflow",
        title: "Implementing an Enterprise RAG Workflow",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# Implementing an Enterprise RAG Workflow

This lesson translates the architecture into an implementation plan.

## Phase 1: Prepare Data Sources

Identify approved document repositories.

Define ownership, classification, and update frequency.

## Phase 2: Build the Ingestion Pipeline

Implement:

- Document retrieval.
- Text extraction.
- Content cleaning.
- Chunking.
- Metadata creation.
- Embedding generation.
- Vector storage.

## Phase 3: Build the Query API

The backend should:

1. Authenticate the user.
2. Resolve the user's organization and permissions.
3. Validate the question.
4. Generate the query embedding.
5. Search authorized document collections.
6. Rank retrieved content.

## Phase 4: Build the Generation Workflow

Construct the model prompt using:

- Approved system instructions.
- User question.
- Retrieved context.
- Source references.
- Output requirements.

## Phase 5: Validate Results

Validate:

- Response structure.
- Source references.
- Required fields.
- Access permissions.
- Error conditions.

## Phase 6: Build the User Interface

The user interface should display:

- User question.
- Generated answer.
- Supporting documents.
- Relevant document sections.
- Warnings when information is unavailable.

## Phase 7: Test and Monitor

Test:

- Normal queries.
- Ambiguous questions.
- Unauthorized requests.
- Empty retrieval results.
- Outdated documents.
- Malicious document content.
- Provider failures.

## Deployment Consideration

Begin with a limited document collection and a controlled group of users.

Expand only after security and retrieval quality have been evaluated.

## Key Principle

Build the RAG workflow incrementally and validate each stage before expanding to production.`,
          },
          {
            type: 'check',
            question: "What should happen before expanding an enterprise RAG solution to production users?",
            options: [
              "Evaluate security, retrieval quality, and operational readiness",
              "Disable document permissions",
              "Allow unrestricted model access to company systems",
              "Remove all source references",
            ],
            answer: 0,
            explanation: "Security, retrieval quality, and operational readiness should be evaluated before expanding a RAG solution to production.",
          },
        ],
      },
      {
        id: "enterprise-rag-capstone",
        title: "Capstone: Build an Enterprise RAG Architecture",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Capstone: Build an Enterprise RAG Architecture

This final project brings together the concepts covered throughout the course.

You will design a secure enterprise knowledge retrieval solution.

## Project Scenario

A multinational organization wants to build an AI assistant that answers employee questions using internal documentation.

The solution must support multiple departments and protect confidential information.

## Project Requirements

Design a solution that:

1. Ingests documents from approved sources.
2. Extracts and cleans document content.
3. Divides documents into meaningful chunks.
4. Generates embeddings.
5. Stores vectors and metadata.
6. Performs semantic retrieval.
7. Supports metadata filtering.
8. Enforces document-level authorization.
9. Uses an LLM to generate grounded responses.
10. Provides source citations.
11. Handles missing information.
12. Supports monitoring and evaluation.

## Required Deliverables

### 1. Architecture Diagram

Show the ingestion pipeline and query pipeline.

### 2. Data Model

Define the document, chunk, embedding, and metadata structures.

### 3. Retrieval Strategy

Explain the similarity metric, indexing approach, filtering, and ranking strategy.

### 4. Security Architecture

Document authentication, authorization, tenant isolation, and data protection controls.

### 5. Prompt Design

Create system instructions that require the assistant to use retrieved information and identify unsupported answers.

### 6. Evaluation Plan

Define retrieval and generation quality metrics.

### 7. Operational Plan

Document monitoring, backup, document lifecycle management, and incident handling.

## Test Scenarios

Your design must address:

- A question with a clear answer.
- A question with no supporting document.
- A question involving confidential information.
- An outdated document.
- A document containing malicious instructions.
- An ambiguous question.

## Evaluation Criteria

Your solution will be evaluated on:

- Architecture quality.
- Retrieval effectiveness.
- Data modeling.
- Security controls.
- Response grounding.
- Scalability.
- Operational readiness.

## Final Takeaway

RAG enables organizations to connect language models to their own knowledge.

However, successful enterprise RAG requires much more than embeddings and a vector database.

It requires secure data ingestion, retrieval architecture, access control, evaluation, monitoring, and governance.`,
          },
          {
            type: 'check',
            question: "What is the primary objective of the enterprise RAG capstone?",
            options: [
              "Design a secure knowledge retrieval and generation architecture",
              "Create an unrestricted chatbot",
              "Replace all organizational databases",
              "Train a language model without using external knowledge",
            ],
            answer: 0,
            explanation: "The capstone demonstrates how to design a secure, scalable, and governed RAG architecture using enterprise knowledge sources.",
          },
        ],
      },
    ],
  },
];

runCourseSeed({ course: COURSE, modules: MODULES, script: 'scripts/embeddings-rag/seed-embeddings-rag.mjs' }).catch((error) => {
  console.error('\nSEED FAILED:', error);
  process.exit(1);
});
