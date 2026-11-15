/**
 * Enterprise AI Architecture
 *
 * Dry run:
 * node scripts/enterprise-ai-architecture/seed-enterprise-ai-architecture.mjs
 *
 * Apply:
 * node scripts/enterprise-ai-architecture/seed-enterprise-ai-architecture.mjs --apply
 */

import {
  applicationDefault,
  initializeApp,
} from 'firebase-admin/app';

import {
  FieldValue,
  getFirestore,
} from 'firebase-admin/firestore';

const PROJECT_ID = process.env.GCLOUD_PROJECT || 'zebron-2b49f';
const APPLY = process.argv.includes('--apply');
const OVERWRITE = process.argv.includes('--overwrite');

initializeApp({
  credential: applicationDefault(),
  projectId: PROJECT_ID,
});

const db = getFirestore();

const COURSE = {
  id: 'enterprise-ai-architecture',
  title: 'Enterprise AI Architecture',
  subtitle: 'Architect secure, scalable, and production-ready AI solutions for enterprise environments.',
  description:
    'Learn to design enterprise AI architectures, select appropriate models, structure AI data platforms, implement RAG and multi-agent systems, integrate enterprise applications, and establish security and governance controls.',
  level: 'advanced',
  language: 'en',
  category: 'Artificial Intelligence',
  program: 'Enterprise AI & Solutions Architecture',
  programOrder: 9,
  status: 'draft',
  cover: 'ai-architecture',
  tags: [
    'Enterprise AI',
    'AI Architecture',
    'Solution Architecture',
    'RAG',
    'Multi-Agent Systems',
    'Cloud Architecture',
    'AI Governance',
    'Enterprise Integration',
  ],
};

const MODULES = [
  // =========================================================
  // MODULE 1: ENTERPRISE AI ARCHITECTURE FUNDAMENTALS
  // =========================================================
  {
    id: 'enterprise-ai-fundamentals',
    title: 'Enterprise AI Architecture Fundamentals',
    lessons: [
      {
        id: 'understanding-enterprise-ai-architecture',
        title: 'Understanding Enterprise AI Architecture',
        minutes: 18,
        blocks: [
          {
            type: 'text',
            text: `# Understanding Enterprise AI Architecture

## Introduction

Enterprise AI architecture is the structured design of the technology, data, models, applications, infrastructure, security controls, and operational processes required to deliver AI capabilities across an organization.

Unlike a standalone AI application, an enterprise AI solution must operate within an organization's existing technology ecosystem.

It must support business objectives, integrate with enterprise systems, protect sensitive information, and operate reliably at scale.

## Core Architecture Layers

An enterprise AI architecture commonly includes:

### 1. Experience Layer
Provides interfaces through which employees, customers, and other authorized users interact with AI capabilities.

Examples include:
- Enterprise chat applications.
- Virtual assistants.
- AI-enabled business applications.
- Customer service portals.

### 2. Application and Orchestration Layer
Coordinates AI workflows, agent activities, application logic, and business processes.

Examples include:
- AI agents.
- Workflow engines.
- Prompt orchestration.
- Tool and function execution.

### 3. Model Layer
Contains the AI models responsible for generating responses, classifying information, extracting data, or performing other intelligent tasks.

Examples include:
- Large language models.
- Embedding models.
- Classification models.
- Specialized domain models.

### 4. Data and Knowledge Layer
Provides the information required by AI systems.

Examples include:
- Enterprise databases.
- Document repositories.
- Knowledge bases.
- Vector databases.
- Data warehouses.

### 5. Infrastructure Layer
Provides the computing and networking resources required to operate AI workloads.

Examples include:
- Cloud infrastructure.
- GPU computing.
- Container platforms.
- Storage.
- Networking.

### 6. Security and Governance
Applies controls across all architecture layers.

Examples include:
- Identity and access management.
- Encryption.
- Data protection.
- Audit logging.
- Model governance.
- Regulatory compliance.

## Architecture Is More Than Selecting an LLM

An organization cannot achieve enterprise readiness simply by connecting an application to an LLM API.

The architect must consider data access, identity, integration, model performance, operational monitoring, availability, cost, and governance.

## Practical Example

A financial institution wants an AI assistant that helps employees answer questions about internal policies.

The architecture might include:
1. An employee portal as the experience layer.
2. An orchestration service that manages requests.
3. An LLM that generates responses.
4. A RAG service that retrieves approved policy documents.
5. Enterprise identity services that enforce access.
6. Monitoring and audit services that record activity.

The architecture must ensure that employees only receive information they are authorized to access.

## Key Takeaway

Enterprise AI architecture connects AI capabilities to business systems, organizational data, infrastructure, security, and operational processes.`
          },
          {
            type: 'check',
            question: 'What distinguishes enterprise AI architecture from a standalone AI application?',
            options: [
              'It only focuses on selecting the most powerful LLM.',
              'It integrates AI with enterprise systems, data, infrastructure, security, and governance.',
              'It eliminates the need for existing business applications.',
              'It requires every organization to train its own foundation model.'
            ],
            answer: 1,
            explanation: 'Enterprise AI architecture addresses the complete environment required to operate AI securely and reliably within an organization.'
          }
        ]
      },
      {
        id: 'business-requirements-and-ai-architecture',
        title: 'Translating Business Requirements into AI Architecture',
        minutes: 20,
        blocks: [
          {
            type: 'text',
            text: `# Translating Business Requirements into AI Architecture

## Introduction

AI architecture should begin with a business problem, not a technology selection.

Enterprise architects translate organizational objectives into technical requirements and architecture decisions.

## Step 1: Identify the Business Problem

Start by understanding what the organization wants to improve.

Examples:
- Reduce customer support response times.
- Automate document processing.
- Improve enterprise search.
- Assist employees with policy interpretation.
- Identify patterns in operational data.

A vague requirement such as "implement AI" is not sufficient.

A better requirement is:

"Reduce the average time required for employees to locate approved internal procedures by 40%."

## Step 2: Identify Stakeholders

Different stakeholders have different expectations.

Business owners focus on outcomes and return on investment.

Security teams focus on information protection and access controls.

Data teams focus on data quality, availability, and ownership.

Application teams focus on integration and operational support.

End users focus on usability and accuracy.

## Step 3: Define Functional Requirements

Functional requirements describe what the AI solution must do.

Examples:
- Accept natural-language questions.
- Retrieve relevant enterprise documents.
- Generate answers with supporting references.
- Escalate uncertain requests to a human.
- Integrate with an employee portal.

## Step 4: Define Nonfunctional Requirements

Nonfunctional requirements describe how the system must operate.

Examples include:

**Performance:** Response time and throughput.

**Availability:** Expected uptime and recovery capabilities.

**Scalability:** Ability to support increasing user demand.

**Security:** Authentication, authorization, and encryption.

**Reliability:** Consistent behavior and error handling.

**Cost:** Infrastructure and model usage expenses.

## Step 5: Convert Requirements into Architecture Decisions

Consider an employee knowledge assistant.

| Requirement | Architecture Decision |
|---|---|
| Natural-language interaction | LLM integration |
| Search internal policies | RAG architecture |
| Restrict document access | Identity-aware retrieval |
| Track usage | Monitoring and audit logging |
| Support growth | Scalable application infrastructure |
| Reduce incorrect answers | Grounding and evaluation |

## Step 6: Define Success Measures

Architecture should include measurable outcomes.

Examples:
- Average response time.
- Retrieval relevance.
- Answer accuracy.
- User adoption.
- Cost per request.
- Percentage of requests escalated to humans.

## Architecture Tradeoffs

Enterprise architecture involves balancing competing priorities.

For example, a highly capable model may produce better responses but cost more and introduce higher latency.

An architect evaluates these tradeoffs against business requirements.

## Key Takeaway

The architect's responsibility is to translate business needs into measurable technical requirements and defensible architecture decisions.`
          },
          {
            type: 'check',
            question: 'A business requests an AI assistant to reduce the time employees spend searching for policies. What should the architect do first?',
            options: [
              'Immediately select the largest available LLM.',
              'Purchase additional GPU infrastructure.',
              'Clarify the business problem, stakeholders, requirements, and success measures.',
              'Begin developing a custom foundation model.'
            ],
            answer: 2,
            explanation: 'Architecture should begin with understanding the business problem and defining requirements before selecting technologies.'
          }
        ]
      },
      {
        id: 'enterprise-ai-architecture-quality-attributes',
        title: 'Enterprise AI Quality Attributes and Architecture Drivers',
        minutes: 19,
        blocks: [
          {
            type: 'text',
            text: `# Enterprise AI Quality Attributes and Architecture Drivers

## Introduction

Quality attributes describe the characteristics that determine whether an AI solution is suitable for enterprise operation.

They influence architecture decisions just as much as functional requirements.

## 1. Scalability

Scalability is the ability to handle increasing workloads.

An AI application may initially support 100 users but eventually need to support 50,000.

Architectural considerations include:
- Horizontal application scaling.
- Request queues.
- Load balancing.
- Model throughput.
- Database capacity.

## 2. Availability

Availability measures whether the solution is accessible when users need it.

Architectural approaches include:
- Redundant infrastructure.
- Health checks.
- Failover mechanisms.
- Multiple availability zones.
- Disaster recovery.

## 3. Performance and Latency

AI systems have several potential sources of latency:

- User interface processing.
- API communication.
- Document retrieval.
- Model inference.
- Tool execution.

Architects should measure end-to-end response time rather than model response time alone.

## 4. Reliability

Reliability concerns whether the solution performs consistently under expected operating conditions.

AI reliability also includes:
- Handling malformed inputs.
- Managing model timeouts.
- Detecting unavailable tools.
- Handling incomplete retrieval results.
- Preventing uncontrolled agent execution.

## 5. Security

Security must be incorporated into every architecture layer.

Important controls include:
- Authentication.
- Authorization.
- Encryption.
- Secrets management.
- Network restrictions.
- Audit logging.

## 6. Maintainability

Enterprise AI systems must be understandable and maintainable over time.

Good practices include:
- Modular services.
- Documented interfaces.
- Versioned prompts.
- Model configuration management.
- Automated testing.
- Architecture documentation.

## 7. Observability

Observability helps teams understand system behavior.

Useful measurements include:
- Request volume.
- Error rates.
- Response latency.
- Model usage.
- Token consumption.
- Retrieval performance.
- Agent tool execution.
- Cost per transaction.

## Architecture Drivers

Architecture drivers are the factors that have the greatest influence on design decisions.

For example, a healthcare organization may prioritize data privacy and regulatory compliance.

A customer support organization may prioritize availability, response time, and scalability.

A government organization may have strict requirements concerning data classification, authorization, hosting, and auditability.

## Architecture Tradeoff Example

An organization wants very low response latency.

One option is to deploy models closer to the application and cache frequently requested information.

However, caching introduces data freshness and authorization concerns.

The architect must evaluate the performance improvement against the security and consistency risks.

## Key Takeaway

Quality attributes such as scalability, availability, security, reliability, and observability are major drivers of enterprise AI architecture decisions.`
          },
          {
            type: 'check',
            question: 'An enterprise AI assistant must support thousands of concurrent users. Which quality attribute is most directly associated with handling increasing workloads?',
            options: [
              'Maintainability',
              'Scalability',
              'Auditability',
              'Portability'
            ],
            answer: 1,
            explanation: 'Scalability describes a system’s ability to handle increasing workloads by expanding available resources and capacity.'
          }
        ]
      }
    ]
  },

  // =========================================================
  // MODULE 2: AI SOLUTION ARCHITECTURE PATTERNS
  // =========================================================
  {
    id: 'ai-solution-architecture-patterns',
    title: 'AI Solution Architecture Patterns',
    lessons: [
      {
        id: 'centralized-and-distributed-ai-architectures',
        title: 'Centralized and Distributed AI Architectures',
        minutes: 20,
        blocks: [
          {
            type: 'text',
            text: `# Centralized and Distributed AI Architectures

## Introduction

Enterprise AI solutions can be organized using centralized, distributed, or hybrid architecture patterns.

The correct pattern depends on organizational structure, security requirements, integration needs, and operational complexity.

## Centralized AI Architecture

A centralized architecture provides shared AI capabilities through a common platform or service.

For example, an organization may operate one enterprise AI gateway that provides access to approved models.

Business applications send requests through this gateway.

### Advantages

- Centralized security policies.
- Consistent model access.
- Shared monitoring.
- Standardized integrations.
- Easier governance.

### Challenges

- Potential bottleneck.
- Central service dependency.
- Complex coordination across business units.
- Shared infrastructure capacity constraints.

## Distributed AI Architecture

A distributed architecture allows individual departments, applications, or business units to operate separate AI services.

For example:
- Finance operates a financial document assistant.
- Human Resources operates an employee policy assistant.
- Customer Support operates a customer service agent.

### Advantages

- Greater team autonomy.
- Workload isolation.
- Department-specific customization.
- Independent deployment schedules.

### Challenges

- Governance inconsistency.
- Duplicate infrastructure.
- Fragmented monitoring.
- Increased integration complexity.

## Hybrid AI Architecture

A hybrid architecture combines centralized governance with distributed implementation.

For example:
- A central AI platform manages approved models, identity integration, security standards, and monitoring.
- Individual departments build their own AI applications using those shared capabilities.

This pattern is common in large enterprises.

## Architecture Decision Example

An organization has 15 business units.

Each unit needs specialized AI applications, but leadership requires centralized security and cost management.

A hybrid architecture may provide the best balance.

The central platform provides shared controls while individual business units manage their applications.

## Key Takeaway

Centralized architecture emphasizes shared control, distributed architecture emphasizes autonomy, and hybrid architecture balances enterprise governance with local flexibility.`
          },
          {
            type: 'check',
            question: 'An enterprise wants departments to build their own AI applications while enforcing centralized model approval, security, and monitoring. Which architecture pattern is most appropriate?',
            options: [
              'Fully centralized architecture',
              'Fully distributed architecture',
              'Hybrid architecture',
              'Single-user architecture'
            ],
            answer: 2,
            explanation: 'A hybrid architecture combines centralized governance and shared services with distributed application development.'
          }
        ]
      },
      {
        id: 'microservices-and-event-driven-ai',
        title: 'Microservices and Event-Driven AI Architectures',
        minutes: 21,
        blocks: [
          {
            type: 'text',
            text: `# Microservices and Event-Driven AI Architectures

## Introduction

Enterprise AI applications often require multiple services to perform separate responsibilities.

Microservices and event-driven architecture provide patterns for organizing these responsibilities.

## Microservices Architecture

Microservices divide an application into independently deployable services.

An enterprise AI solution might contain:

- API gateway.
- Authentication service.
- AI orchestration service.
- Retrieval service.
- Model integration service.
- Document processing service.
- Monitoring service.

Each service has a defined responsibility and communicates through documented interfaces.

### Benefits

- Independent deployment.
- Service-level scaling.
- Technology flexibility.
- Fault isolation.
- Clear responsibility boundaries.

### Challenges

- Distributed system complexity.
- Network communication failures.
- Service discovery.
- Distributed tracing.
- Data consistency.

## Event-Driven Architecture

Event-driven architecture uses events to communicate that something has happened.

For example, when a user uploads a document:

1. The application publishes a document-uploaded event.
2. A processing service receives the event.
3. The service extracts document content.
4. An embedding service generates vector representations.
5. The vector database is updated.
6. The system publishes a processing-completed event.

The workflow does not require every service to execute synchronously.

## Message Brokers

Message brokers help services exchange events and messages.

They can support:
- Asynchronous processing.
- Message buffering.
- Retry mechanisms.
- Service decoupling.
- Workload distribution.

## Synchronous vs. Asynchronous Processing

A synchronous request waits for the receiving service to respond.

An asynchronous workflow allows processing to continue independently.

For example, an AI assistant answering a simple question may use synchronous processing.

Processing 10,000 uploaded documents is more suitable for an asynchronous workflow.

## Reliability Considerations

Distributed AI systems should account for:

- Duplicate events.
- Failed messages.
- Retry policies.
- Dead-letter queues.
- Idempotent processing.
- Event ordering.

Idempotency means that repeating an operation does not create unintended duplicate effects.

## Key Takeaway

Microservices separate application responsibilities, while event-driven architecture enables loosely coupled asynchronous communication between services.`
          },
          {
            type: 'check',
            question: 'An organization uploads thousands of documents that must be processed, embedded, and indexed without keeping users waiting. Which pattern is most appropriate?',
            options: [
              'Synchronous processing for every document',
              'Event-driven asynchronous processing',
              'A single shared database transaction',
              'Direct browser-to-model communication'
            ],
            answer: 1,
            explanation: 'Event-driven asynchronous processing allows document processing and indexing to occur independently of the user request.'
          }
        ]
      },
      {
        id: 'rag-and-agentic-architecture-patterns',
        title: 'RAG and Agentic Architecture Patterns',
        minutes: 22,
        blocks: [
          {
            type: 'text',
            text: `# RAG and Agentic Architecture Patterns

## Introduction

Two important enterprise AI architecture patterns are Retrieval-Augmented Generation (RAG) and agentic architecture.

They solve different problems and can also be combined.

## Retrieval-Augmented Generation

RAG connects an LLM to external knowledge sources.

A typical RAG workflow includes:

1. A user submits a question.
2. The application converts the question into an embedding.
3. A retrieval service searches a knowledge repository.
4. Relevant documents are returned.
5. The application supplies the retrieved context to the LLM.
6. The LLM generates a grounded response.

### Benefits

- Access to current enterprise information.
- Reduced dependence on model training data.
- Ability to reference organizational knowledge.
- Better control over knowledge sources.

### Limitations

RAG does not guarantee correct answers.

Poor document quality, weak retrieval, incorrect permissions, and irrelevant context can still produce incorrect responses.

## Agentic Architecture

An AI agent can reason about a goal, select tools, perform actions, and evaluate results.

A typical agent architecture includes:

- An LLM.
- An instruction or system prompt.
- A tool registry.
- Memory or state management.
- An orchestration loop.
- Execution controls.
- Monitoring and audit logging.

For example, an IT support agent may:
1. Understand a user's issue.
2. Search a knowledge base.
3. Check an incident record.
4. Recommend a resolution.
5. Request approval before executing a restricted action.

## Combining RAG and Agents

A more advanced architecture combines retrieval with agent execution.

An agent can decide when it needs enterprise knowledge, call a retrieval tool, evaluate the results, and continue its workflow.

For example, a procurement agent might retrieve purchasing policies before preparing a purchase request.

## Choosing the Right Pattern

Use RAG when the primary requirement is answering questions using external or enterprise knowledge.

Use an agent when the requirement involves multiple reasoning steps, tool selection, and actions.

Use both when the solution needs enterprise knowledge and controlled workflow execution.

## Key Takeaway

RAG provides knowledge grounding, while agentic architecture enables goal-oriented reasoning and tool execution.`
          },
          {
            type: 'check',
            question: 'An enterprise solution must retrieve internal policies and then use approved tools to initiate a business workflow. Which architecture is most suitable?',
            options: [
              'RAG only, without application orchestration',
              'A static document website',
              'An agentic architecture integrated with RAG',
              'A standalone embedding model'
            ],
            answer: 2,
            explanation: 'Combining RAG with agentic orchestration enables the solution to retrieve enterprise knowledge and use approved tools to execute workflows.'
          }
        ]
      }
    ]
  },

  // =========================================================
  // MODULE 3: ENTERPRISE AI REFERENCE ARCHITECTURE
  // =========================================================
  {
    id: 'enterprise-ai-reference-architecture',
    title: 'Enterprise AI Reference Architecture',
    lessons: [
      {
        id: 'enterprise-ai-reference-architecture-layers',
        title: 'Enterprise AI Reference Architecture Layers',
        minutes: 21,
        blocks: [
          {
            type: 'text',
            text: `# Enterprise AI Reference Architecture Layers

## Introduction

A reference architecture is a reusable architectural blueprint that describes common components, responsibilities, relationships, and design principles.

It helps organizations standardize how AI solutions are designed and implemented.

## Core Reference Architecture

### 1. User Experience Layer

Provides user-facing interfaces.

Examples:
- Employee portals.
- Customer applications.
- Chat interfaces.
- Mobile applications.

### 2. API and Access Layer

Provides controlled access to enterprise AI services.

Responsibilities include:
- API authentication.
- Request validation.
- Rate limiting.
- Routing.
- Authorization enforcement.

### 3. AI Orchestration Layer

Coordinates model calls, retrieval, agents, and business workflows.

Responsibilities include:
- Prompt construction.
- Model selection.
- Tool execution.
- Workflow management.
- Response handling.

### 4. Model Services Layer

Provides access to approved AI models.

Responsibilities include:
- Model invocation.
- Model version management.
- Model routing.
- Inference monitoring.

### 5. Knowledge and Data Layer

Provides information used by AI solutions.

Examples:
- Enterprise databases.
- Document repositories.
- Vector stores.
- Search indexes.
- Data pipelines.

### 6. Integration Layer

Connects AI services to enterprise systems.

Examples:
- IT service management platforms.
- ERP systems.
- CRM systems.
- HR applications.
- Identity services.

### 7. Infrastructure Layer

Provides the runtime environment.

Examples:
- Cloud platforms.
- Container services.
- Compute resources.
- Networking.
- Storage.

### 8. Cross-Cutting Security and Governance

Security and governance operate across all layers.

They include:
- Identity management.
- Data classification.
- Encryption.
- Audit logging.
- Policy enforcement.
- Compliance monitoring.

## Why Use a Reference Architecture?

It helps organizations:
- Reduce duplicated design effort.
- Establish reusable patterns.
- Improve consistency.
- Standardize integrations.
- Strengthen security.
- Support architecture reviews.

## Practical Example

A company develops separate AI applications for HR, finance, and IT.

Rather than building separate authentication, model access, and monitoring capabilities for every application, the organization can provide shared enterprise services.

Each application uses the same approved architectural foundation.

## Key Takeaway

A reference architecture provides a reusable blueprint for designing consistent, secure, and scalable enterprise AI solutions.`
          },
          {
            type: 'check',
            question: 'What is the primary purpose of an enterprise AI reference architecture?',
            options: [
              'To force every application to use the same user interface.',
              'To provide reusable architectural components, standards, and design patterns.',
              'To eliminate all application integrations.',
              'To replace business requirements with technology standards.'
            ],
            answer: 1,
            explanation: 'A reference architecture establishes reusable patterns and common architectural standards that improve consistency and governance.'
          }
        ]
      },
      {
        id: 'enterprise-ai-gateways-and-model-routing',
        title: 'Enterprise AI Gateways and Model Routing',
        minutes: 22,
        blocks: [
          {
            type: 'text',
            text: `# Enterprise AI Gateways and Model Routing

## Introduction

An enterprise AI gateway provides a controlled entry point for applications that consume AI services.

It can standardize how applications access models and enforce organizational policies.

## What Is an AI Gateway?

An AI gateway is an intermediary between consuming applications and AI model services.

Instead of allowing every application to connect directly to different model providers, applications can communicate through a common gateway.

## Common Responsibilities

### Authentication and Authorization

Verify application identities and enforce access policies.

### Rate Limiting

Control the number of requests made by an application or user.

### Model Routing

Direct requests to appropriate models based on defined policies.

### Logging and Monitoring

Record request metadata, usage, latency, and errors.

### Cost Management

Track model consumption and enforce usage budgets.

### Policy Enforcement

Apply organizational rules concerning approved models, data handling, and request types.

## Model Routing

Different AI workloads may require different models.

For example:

| Workload | Possible Model Requirement |
|---|---|
| Text classification | Small, efficient model |
| Complex reasoning | More capable reasoning model |
| Embedding generation | Embedding model |
| Image understanding | Multimodal model |
| High-volume summaries | Cost-efficient language model |

A routing service can select a model based on workload requirements.

## Routing Strategies

**Rule-based routing:** Uses predefined conditions.

**Capability-based routing:** Selects models based on required capabilities.

**Cost-aware routing:** Considers usage costs.

**Fallback routing:** Redirects requests when a preferred model is unavailable.

## Important Security Considerations

An AI gateway should not be treated as the only security boundary.

Applications must still enforce user authorization, data access controls, and business rules.

Sensitive information should not be exposed simply because a request passes through an approved gateway.

## Example

An enterprise assistant receives a request to summarize a document.

The gateway evaluates:
- Application identity.
- User permissions.
- Data classification.
- Requested model capability.
- Usage limits.

It then routes the request to an approved summarization model.

## Key Takeaway

An enterprise AI gateway standardizes model access, routing, monitoring, usage controls, and policy enforcement across applications.`
          },
          {
            type: 'check',
            question: 'Why might an enterprise use an AI gateway instead of allowing every application to connect directly to model providers?',
            options: [
              'To eliminate the need for authentication.',
              'To centralize model access, routing, monitoring, and policy enforcement.',
              'To ensure every request uses the largest model.',
              'To remove application-level authorization.'
            ],
            answer: 1,
            explanation: 'An AI gateway provides a consistent control point for model access, usage policies, routing, and monitoring.'
          }
        ]
      },
      {
        id: 'designing-reusable-enterprise-ai-services',
        title: 'Designing Reusable Enterprise AI Services',
        minutes: 20,
        blocks: [
          {
            type: 'text',
            text: `# Designing Reusable Enterprise AI Services

## Introduction

Enterprise architecture becomes more efficient when common AI capabilities are developed as reusable services.

Instead of implementing the same functionality repeatedly, organizations can expose standardized services to multiple applications.

## Examples of Reusable AI Services

### Model Inference Service

Provides a consistent interface for invoking approved AI models.

### Embedding Service

Converts text or other supported content into vector representations.

### Retrieval Service

Searches enterprise knowledge repositories and returns relevant information.

### Document Processing Service

Extracts text, metadata, and structured information from documents.

### Prompt Management Service

Stores, versions, and manages approved prompts.

### Evaluation Service

Measures AI output quality using defined test cases and evaluation criteria.

### Audit Service

Records important events for security, compliance, and operational review.

## Service Design Principles

### Clear Responsibility

Each service should have a well-defined purpose.

### Standard Interfaces

Use documented APIs and consistent request and response formats.

### Versioning

Changes to interfaces should be managed carefully to avoid breaking consuming applications.

### Security

Services must authenticate callers and enforce appropriate authorization.

### Observability

Services should expose useful logs, metrics, and traces.

### Reusability

Design services to support multiple applications without introducing unnecessary dependencies.

## Example: Shared Retrieval Service

An organization operates three AI applications:
- HR policy assistant.
- IT support assistant.
- Procurement assistant.

Each application needs access to enterprise knowledge.

A shared retrieval service can provide a consistent interface while enforcing document-level permissions and application-specific retrieval policies.

## Avoiding Overengineering

Not every AI capability needs to become a separate microservice.

Too many small services increase operational complexity.

Architects should consider:
- Business boundaries.
- Scaling requirements.
- Security boundaries.
- Team ownership.
- Deployment needs.

## Key Takeaway

Reusable AI services reduce duplication and improve consistency, but their boundaries should be based on genuine business and technical responsibilities.`
          },
          {
            type: 'check',
            question: 'Three enterprise applications need document retrieval. What is a potential benefit of creating a shared retrieval service?',
            options: [
              'Each application must build its own retrieval engine.',
              'The organization can standardize retrieval interfaces and shared controls.',
              'The applications no longer need authorization.',
              'The service must contain every enterprise business process.'
            ],
            answer: 1,
            explanation: 'A shared retrieval service can reduce duplicated development while providing standardized interfaces and consistent security controls.'
          }
        ]
      }
    ]
  },

  // =========================================================
  // MODULE 4: MODEL SELECTION AND MODEL ARCHITECTURE
  // =========================================================
  {
    id: 'model-selection-and-model-architecture',
    title: 'Model Selection and Model Architecture',
    lessons: [
      {
        id: 'evaluating-enterprise-ai-models',
        title: 'Evaluating Enterprise AI Models',
        minutes: 22,
        blocks: [
          {
            type: 'text',
            text: `# Evaluating Enterprise AI Models

## Introduction

Model selection is an architecture decision that affects performance, security, cost, scalability, and maintainability.

The most powerful model is not necessarily the best model for every enterprise workload.

## Important Evaluation Criteria

### 1. Capability

Determine whether the model supports the required tasks.

Examples:
- Text generation.
- Reasoning.
- Classification.
- Summarization.
- Code generation.
- Image understanding.
- Embedding generation.

### 2. Accuracy and Quality

Evaluate model outputs using representative business scenarios.

Consider:
- Correctness.
- Completeness.
- Relevance.
- Consistency.
- Grounding.
- Instruction following.

### 3. Latency

Measure how long the model takes to produce a response.

Latency may influence user experience, especially for interactive applications.

### 4. Cost

Evaluate:
- Input token pricing.
- Output token pricing.
- Hosting expenses.
- GPU infrastructure.
- Operational overhead.

### 5. Context Window

The context window determines how much information a model can process within a request.

A larger context window may be useful for lengthy documents, but it does not automatically guarantee better reasoning or retrieval.

### 6. Security and Data Handling

Review:
- Data retention policies.
- Data processing locations.
- Encryption.
- Access controls.
- Provider security commitments.
- Regulatory requirements.

### 7. Availability and Scalability

Evaluate provider availability, service limits, throughput, and scaling characteristics.

## Model Evaluation Process

A practical enterprise evaluation process includes:

1. Define the business use case.
2. Identify required model capabilities.
3. Create representative test cases.
4. Evaluate candidate models.
5. Measure quality and latency.
6. Estimate operating costs.
7. Review security requirements.
8. Select and document the preferred model.

## Example

A company needs an AI service to classify 100,000 support tickets each month.

A smaller model may provide sufficient classification accuracy at lower cost.

Using an expensive reasoning model for every ticket may provide little additional business value.

## Key Takeaway

Model selection should be based on measurable workload requirements, security, performance, cost, and operational constraints.`
          },
          {
            type: 'check',
            question: 'An organization must classify a high volume of support tickets at low cost. What should guide model selection?',
            options: [
              'Always select the model with the largest parameter count.',
              'Select a model based only on its popularity.',
              'Evaluate classification quality, throughput, latency, and cost against the workload.',
              'Choose a model without testing it.'
            ],
            answer: 2,
            explanation: 'Model selection should be based on measured performance and cost for the actual business workload.'
          }
        ]
      },
      {
        id: 'foundation-models-fine-tuning-and-specialized-models',
        title: 'Foundation Models, Fine-Tuning, and Specialized Models',
        minutes: 23,
        blocks: [
          {
            type: 'text',
            text: `# Foundation Models, Fine-Tuning, and Specialized Models

## Introduction

Enterprise architects must understand the different ways organizations can use and adapt AI models.

Three important approaches are foundation models, fine-tuning, and specialized models.

## Foundation Models

A foundation model is trained on broad datasets and can support multiple downstream tasks.

Examples of capabilities include:
- Text generation.
- Summarization.
- Question answering.
- Translation.
- Code generation.
- Reasoning.

Organizations can consume foundation models through hosted APIs or deploy supported models within their own infrastructure.

## Fine-Tuning

Fine-tuning adapts a pretrained model using additional training data.

It can help a model learn:
- Domain-specific terminology.
- Desired output formats.
- Specialized response patterns.
- Task-specific behavior.

Fine-tuning is not automatically the best way to give a model access to current enterprise documents.

For changing knowledge, RAG may be more appropriate.

## Specialized Models

Specialized models are designed or optimized for particular tasks.

Examples include:
- Fraud detection models.
- Document classification models.
- Image recognition models.
- Speech recognition models.
- Embedding models.

A specialized model may outperform a general-purpose model on a narrow task.

## Choosing Between Approaches

Use a foundation model when broad capabilities are required.

Consider fine-tuning when the model needs consistent task-specific behavior that cannot be achieved adequately through prompting.

Use RAG when the model needs access to external or frequently updated knowledge.

Use specialized models when a specific task requires optimized performance.

These approaches can also be combined.

## Example: Enterprise Policy Assistant

An organization wants an assistant that answers questions about internal policies.

A suitable design might use:
- A foundation model for language understanding and response generation.
- RAG to retrieve current policies.
- Fine-tuning only if additional domain-specific behavior is justified.

## Important Considerations

Fine-tuning introduces additional responsibilities:
- Dataset preparation.
- Data quality review.
- Training costs.
- Model evaluation.
- Version management.
- Regression testing.

## Key Takeaway

Foundation models provide broad capabilities, fine-tuning adapts model behavior, and specialized models optimize particular tasks. RAG provides access to external knowledge without requiring that knowledge to be embedded into model weights.`
          },
          {
            type: 'check',
            question: 'An organization needs an AI assistant to answer questions using frequently updated internal policy documents. Which approach is generally most appropriate for supplying that knowledge?',
            options: [
              'Fine-tune the model every time a policy changes.',
              'Use RAG to retrieve current policy documents.',
              'Increase the model temperature.',
              'Replace the model with a database.'
            ],
            answer: 1,
            explanation: 'RAG retrieves current external knowledge at query time, avoiding the need to retrain or fine-tune a model whenever documents change.'
          }
        ]
      },
      {
        id: 'model-deployment-and-serving-architectures',
        title: 'Model Deployment and Serving Architectures',
        minutes: 22,
        blocks: [
          {
            type: 'text',
            text: `# Model Deployment and Serving Architectures

## Introduction

After selecting a model, an organization must decide how it will be deployed and accessed.

Model serving architecture determines how inference requests reach the model and how responses are returned.

## Hosted Model APIs

A hosted model API allows an organization to consume a model operated by an external provider.

### Advantages

- Reduced infrastructure management.
- Faster implementation.
- Provider-managed scaling.
- Access to managed model updates.

### Considerations

- External service dependency.
- Data processing requirements.
- Usage costs.
- Network latency.
- Provider availability.
- Contractual and compliance obligations.

## Self-Hosted Models

A self-hosted model runs within infrastructure managed by the organization or its cloud environment.

### Advantages

- Greater infrastructure control.
- Custom deployment options.
- Potentially stronger data residency control.
- More control over model serving configuration.

### Considerations

- GPU infrastructure costs.
- Capacity planning.
- Model optimization.
- Patching and maintenance.
- Availability engineering.
- Specialized operational skills.

## Hybrid Deployment

A hybrid architecture combines hosted and self-hosted models.

For example:
- Sensitive workloads may use approved private infrastructure.
- General-purpose workloads may use hosted model APIs.
- High-volume classification may use a smaller internally hosted model.

## Inference Serving Components

A production model serving environment may include:

- API endpoint.
- Authentication layer.
- Request validation.
- Model server.
- Model runtime.
- GPU or CPU resources.
- Load balancer.
- Monitoring and logging.
- Autoscaling controls.

## Deployment Considerations

### Throughput

How many requests can the service process within a given period?

### Concurrency

How many requests can be handled simultaneously?

### Latency

How quickly does the service respond?

### Availability

What happens when a model instance or provider becomes unavailable?

### Versioning

How are model versions deployed, tested, and rolled back?

## Example

A large enterprise operates an internal AI platform.

The architect selects hosted APIs for general employee productivity applications and a self-hosted model for a restricted internal workload.

The architecture uses a shared gateway to enforce access policies and monitor consumption.

## Key Takeaway

Model deployment decisions should balance control, security, cost, performance, scalability, and operational responsibility.`
          },
          {
            type: 'check',
            question: 'Which is a major operational responsibility introduced by self-hosting an enterprise AI model?',
            options: [
              'Eliminating all model monitoring.',
              'Managing compute capacity, model serving, availability, and maintenance.',
              'Removing the need for application authentication.',
              'Guaranteeing that model outputs are always correct.'
            ],
            answer: 1,
            explanation: 'Self-hosting gives the organization more deployment control but also makes it responsible for infrastructure, serving, scaling, availability, and maintenance.'
          }
        ]
      }
    ]
  },


  // =========================================================
  // MODULE 5: DATA ARCHITECTURE FOR ENTERPRISE AI
  // =========================================================
  {
    id: 'data-architecture-enterprise-ai',
    title: 'Data Architecture for Enterprise AI',
    lessons: [
      {
        id: 'enterprise-ai-data-foundations',
        title: 'Enterprise AI Data Foundations',
        minutes: 21,
        blocks: [
          {
            type: 'text',
            text: `# Enterprise AI Data Foundations

## Introduction

Enterprise AI systems depend on reliable, accessible, and properly governed data.

An AI model may have excellent reasoning capabilities, but its usefulness is limited when the information supplied to it is incomplete, outdated, inaccurate, or inaccessible.

Enterprise data architecture defines how organizational information is collected, stored, processed, governed, and made available to AI applications.

## Enterprise Data Sources

AI applications may consume information from multiple systems:

- Relational databases.
- Enterprise data warehouses.
- Data lakes.
- Document management systems.
- Knowledge management platforms.
- CRM and ERP systems.
- IT service management platforms.
- External APIs.

For example, an enterprise IT assistant might retrieve information from ServiceNow, an asset management database, and an internal knowledge repository.

## Structured and Unstructured Data

### Structured Data

Structured data follows a defined schema.

Examples:
- Employee records.
- Asset inventories.
- Financial transactions.
- Customer records.
- Incident records.

Structured data is commonly stored in relational databases and other systems with defined fields.

### Unstructured Data

Unstructured data does not follow a consistent tabular structure.

Examples:
- PDF documents.
- Word documents.
- Emails.
- Images.
- Audio recordings.
- Meeting transcripts.

AI applications often need document processing pipelines to extract useful information from these sources.

## Data Pipelines

A data pipeline moves information from source systems into destinations where it can be processed or consumed.

A typical AI data pipeline includes:

1. Data ingestion.
2. Validation.
3. Transformation.
4. Enrichment.
5. Storage.
6. Indexing.
7. Retrieval.

## Batch and Streaming Ingestion

Batch ingestion processes data periodically.

For example, an organization may synchronize policy documents every night.

Streaming ingestion processes data continuously or as events occur.

For example, a customer service application may process new transactions as they happen.

## Data Quality

Important data quality dimensions include:

- Accuracy.
- Completeness.
- Consistency.
- Timeliness.
- Validity.
- Uniqueness.

Poor data quality can negatively affect retrieval relevance and AI response quality.

## Data Architecture Example

An organization wants an AI assistant to answer questions about employee benefits.

The architecture may retrieve information from:
- An HR database.
- A benefits document repository.
- An employee policy knowledge base.

The data pipeline extracts and indexes the documents while maintaining their source metadata and access restrictions.

## Key Takeaway

Enterprise AI depends on well-designed data architecture that makes trustworthy, relevant, and authorized information available to AI applications.`
          },
          {
            type: 'check',
            question: 'An enterprise AI assistant provides incorrect answers because its source documents contain outdated information. Which data quality dimension is most directly affected?',
            options: [
              'Availability',
              'Timeliness',
              'Network throughput',
              'Model temperature'
            ],
            answer: 1,
            explanation: 'Timeliness concerns whether information is current enough for its intended business use.'
          }
        ]
      },
      {
        id: 'enterprise-data-platforms-and-storage',
        title: 'Enterprise Data Platforms and Storage',
        minutes: 22,
        blocks: [
          {
            type: 'text',
            text: `# Enterprise Data Platforms and Storage

## Introduction

Enterprise AI architectures use different storage technologies depending on the type of information, access patterns, and workload requirements.

No single database technology is appropriate for every AI use case.

## Relational Databases

Relational databases organize information into tables with defined relationships.

Examples include:
- PostgreSQL.
- Microsoft SQL Server.
- MySQL.
- Oracle Database.

They are useful for:
- Transactional records.
- Customer information.
- Inventory.
- Financial data.
- Structured business records.

## Data Warehouses

A data warehouse stores structured and transformed information optimized for analytics.

Examples include:
- Snowflake.
- Google BigQuery.
- Amazon Redshift.
- Microsoft Fabric Warehouse.

They support:
- Business intelligence.
- Historical analysis.
- Reporting.
- Analytical workloads.
- Data aggregation.

## Data Lakes

A data lake stores large volumes of data in its original or transformed formats.

It can support:
- Structured datasets.
- Semi-structured data.
- Documents.
- Images.
- Logs.
- Machine learning datasets.

## Object Storage

Object storage is commonly used for documents, images, audio, backups, and other unstructured information.

Examples include:
- Amazon S3.
- Azure Blob Storage.
- Google Cloud Storage.

## Vector Databases

Vector databases store and retrieve vector representations of information.

They are particularly useful for semantic search and RAG applications.

Examples include:
- Pinecone.
- Weaviate.
- Milvus.
- Qdrant.
- PostgreSQL with pgvector.

## Choosing the Right Storage Technology

| Requirement | Suitable Technology |
|---|---|
| Transaction processing | Relational database |
| Business analytics | Data warehouse |
| Large-scale raw data | Data lake |
| Document storage | Object storage |
| Semantic retrieval | Vector database |
| Operational application records | Operational database |

These technologies may be combined in one enterprise AI architecture.

## Example: Enterprise Knowledge Platform

An organization stores source documents in object storage.

A document processing service extracts text and metadata.

The resulting information is indexed in a search platform or vector database.

The original documents remain in object storage, while the retrieval system provides relevant content to AI applications.

## Data Governance Considerations

Storage design should account for:

- Data ownership.
- Classification.
- Retention.
- Encryption.
- Backup and recovery.
- Access permissions.
- Data residency.
- Lifecycle management.

## Key Takeaway

Enterprise AI architectures frequently combine relational databases, data warehouses, data lakes, object storage, and vector databases to support different data requirements.`
          },
          {
            type: 'check',
            question: 'An enterprise needs to retrieve documents based on semantic similarity rather than exact keyword matches. Which storage technology is particularly suitable?',
            options: [
              'Relational database without vector capabilities',
              'Vector database',
              'Traditional file server only',
              'Transactional message queue'
            ],
            answer: 1,
            explanation: 'Vector databases support similarity search over embeddings, making them useful for semantic retrieval.'
          }
        ]
      },
      {
        id: 'data-governance-lineage-and-access',
        title: 'Data Governance, Lineage, and Access Control',
        minutes: 23,
        blocks: [
          {
            type: 'text',
            text: `# Data Governance, Lineage, and Access Control

## Introduction

Enterprise AI systems must ensure that information is trustworthy, traceable, and accessible only to authorized users.

Data governance establishes the policies and responsibilities that control how organizational data is managed.

## Data Ownership

Every important enterprise dataset should have an identified owner.

Data owners are responsible for defining:
- Appropriate business use.
- Data quality expectations.
- Access requirements.
- Retention policies.
- Classification.

Data stewards may support the implementation of these responsibilities.

## Data Classification

Organizations classify information according to its sensitivity and business impact.

Common classifications include:

- Public.
- Internal.
- Confidential.
- Restricted.

Classification determines which controls should apply when data is stored, processed, transmitted, or supplied to AI models.

## Data Lineage

Data lineage describes where information originated and how it changed as it moved through systems.

For example:

1. A policy document is uploaded.
2. A processing service extracts its contents.
3. The text is divided into chunks.
4. Embeddings are generated.
5. The chunks are indexed.
6. An AI assistant retrieves the information.

Lineage helps organizations understand which source material contributed to an AI-generated response.

## Access Control

AI retrieval must respect the permissions of the underlying source systems.

Consider an HR knowledge assistant.

A manager may have permission to access certain employee records that a regular employee cannot see.

The AI system must preserve those authorization boundaries.

## Retrieval-Time Authorization

One approach is to enforce permissions when information is retrieved.

The retrieval service evaluates:
- User identity.
- Group membership.
- Document permissions.
- Organizational boundaries.
- Application access policies.

Only authorized information should be supplied to the model.

## Metadata and Security Labels

Documents may contain metadata such as:

- Document owner.
- Department.
- Classification.
- Organization.
- Effective date.
- Expiration date.
- Access groups.

This metadata can support filtering and authorization during retrieval.

## Example

An enterprise AI assistant searches a knowledge repository containing HR, finance, and engineering documents.

A finance employee asks a question about a financial policy.

The retrieval service checks the employee's permissions and returns only authorized documents.

## Key Takeaway

Enterprise data governance must preserve ownership, lineage, classification, and access permissions throughout AI data processing and retrieval.`
          },
          {
            type: 'check',
            question: 'Why should an enterprise RAG system enforce document permissions during retrieval?',
            options: [
              'To make every document publicly available.',
              'To ensure users only receive information they are authorized to access.',
              'To eliminate the need for identity management.',
              'To increase the model temperature.'
            ],
            answer: 1,
            explanation: 'Retrieval-time authorization prevents the AI system from exposing information that the requesting user is not permitted to access.'
          }
        ]
      }
    ]
  },

  // =========================================================
  // MODULE 6: RAG AND KNOWLEDGE ARCHITECTURE
  // =========================================================
  {
    id: 'rag-and-knowledge-architecture',
    title: 'RAG and Knowledge Architecture',
    lessons: [
      {
        id: 'rag-architecture-fundamentals',
        title: 'RAG Architecture Fundamentals',
        minutes: 22,
        blocks: [
          {
            type: 'text',
            text: `# RAG Architecture Fundamentals

## Introduction

Retrieval-Augmented Generation (RAG) combines information retrieval with large language model generation.

Instead of relying exclusively on information learned during model training, a RAG application retrieves relevant information from an external knowledge source and provides it to the model as context.

This allows an AI application to answer questions using organizational information that may not have been part of the model's original training data.

## Why Enterprises Use RAG

Enterprise organizations often have information distributed across:

- Policy documents.
- Knowledge articles.
- Technical documentation.
- Contracts.
- Product manuals.
- Internal databases.
- Support repositories.

RAG provides a way to make this information available to AI applications without retraining the language model every time the source content changes.

## Core RAG Components

A typical RAG architecture includes:

1. Source data.
2. Document ingestion.
3. Text extraction.
4. Document chunking.
5. Embedding generation.
6. Vector storage or search indexing.
7. Query embedding.
8. Similarity retrieval.
9. Context construction.
10. LLM generation.

## RAG Request Flow

When a user asks a question:

1. The application receives the question.
2. The retrieval service converts the question into an embedding.
3. The retrieval service searches the knowledge index.
4. Relevant passages are selected.
5. The application builds a prompt containing the passages.
6. The language model generates a response.
7. The application returns the answer and, where available, source references.

## RAG Versus Model Fine-Tuning

RAG supplies external information at inference time.

Fine-tuning changes model behavior through additional training.

RAG is often appropriate when an application needs access to changing organizational knowledge.

Fine-tuning may be useful when an organization needs to adapt a model's behavior, style, or task performance.

These techniques can also be combined.

## Enterprise Example

An employee asks an AI assistant:

"What is our process for requesting a replacement laptop?"

The RAG system searches the approved IT knowledge base, retrieves the relevant policy and service catalog instructions, and supplies that information to the language model.

The model generates an answer based on the retrieved content.

## Key Takeaway

RAG connects enterprise knowledge sources to language models, allowing AI applications to generate responses grounded in retrieved organizational information.`
          },
          {
            type: 'check',
            question: 'What is the primary purpose of retrieval in a RAG architecture?',
            options: [
              'To permanently retrain the language model.',
              'To retrieve relevant external information that can ground the model response.',
              'To replace identity and access management.',
              'To eliminate the need for a language model.'
            ],
            answer: 1,
            explanation: 'Retrieval supplies relevant external information to the language model as context for generating a grounded response.'
          }
        ]
      },
      {
        id: 'document-ingestion-chunking-and-embeddings',
        title: 'Document Ingestion, Chunking, and Embeddings',
        minutes: 23,
        blocks: [
          {
            type: 'text',
            text: `# Document Ingestion, Chunking, and Embeddings

## Introduction

A RAG system must transform source documents into a format that supports efficient retrieval.

This process typically includes document ingestion, text extraction, normalization, chunking, and embedding generation.

## Document Ingestion

Ingestion collects information from approved source systems.

Sources may include:
- PDF files.
- Word documents.
- HTML pages.
- Knowledge articles.
- Databases.
- Internal APIs.
- File repositories.

## Text Extraction

The ingestion pipeline extracts usable text from source documents.

Depending on the source, extraction may require:
- PDF parsing.
- HTML parsing.
- Optical character recognition.
- Table extraction.
- Metadata extraction.

## Document Chunking

Large documents are divided into smaller segments called chunks.

Chunking helps retrieval systems identify relevant portions of a document instead of returning an entire large file.

## Chunking Strategies

### Fixed-Size Chunking

Divides text into chunks based on a defined token or character size.

### Semantic Chunking

Attempts to divide content according to meaning or topic boundaries.

### Structure-Based Chunking

Uses document structure such as headings, paragraphs, sections, or tables.

## Chunk Overlap

Some systems allow adjacent chunks to share a small amount of content.

Overlap can preserve context across chunk boundaries.

However, excessive overlap increases storage and retrieval costs.

## Embeddings

An embedding is a numerical representation of information.

An embedding model converts text into a vector that captures aspects of its semantic meaning.

Similar concepts may have vectors that are close to one another in the embedding space.

## Metadata

Each chunk should retain useful metadata, such as:

- Source document ID.
- Document title.
- Section heading.
- Page number.
- Owner.
- Classification.
- Access permissions.
- Last updated date.

## Example

A 100-page IT policy document is processed.

The system extracts its text, identifies headings, divides the content into meaningful chunks, generates embeddings, and stores each chunk with its source metadata.

When a user asks a question, the retrieval service can locate relevant sections rather than returning all 100 pages.

## Key Takeaway

Document ingestion, thoughtful chunking, embeddings, and metadata provide the foundation for effective enterprise knowledge retrieval.`
          },
          {
            type: 'check',
            question: 'Why should a RAG ingestion pipeline preserve document metadata when creating chunks?',
            options: [
              'Metadata is only useful for changing model temperature.',
              'Metadata supports source tracking, filtering, authorization, and citations.',
              'Metadata eliminates the need for embeddings.',
              'Metadata guarantees that every answer is correct.'
            ],
            answer: 1,
            explanation: 'Metadata helps retrieval systems filter content, enforce access restrictions, identify source documents, and provide traceability.'
          }
        ]
      },
      {
        id: 'retrieval-ranking-and-grounded-generation',
        title: 'Retrieval, Ranking, and Grounded Generation',
        minutes: 24,
        blocks: [
          {
            type: 'text',
            text: `# Retrieval, Ranking, and Grounded Generation

## Introduction

Retrieval quality strongly influences the quality of a RAG application's responses.

Even a capable language model may produce an inaccurate answer when it receives irrelevant, incomplete, or outdated context.

## Similarity Search

A retrieval system compares the embedding of a user query with stored document embeddings.

It returns chunks that are semantically similar to the query.

## Top-K Retrieval

Top-K retrieval selects a defined number of the highest-ranked results.

For example, a system may retrieve the five most relevant chunks.

The correct value depends on:
- Document size.
- Query complexity.
- Context window.
- Retrieval quality.
- Latency and cost requirements.

## Hybrid Search

Hybrid search combines semantic retrieval with keyword-based search.

Semantic search helps identify conceptually related information.

Keyword search helps locate exact names, identifiers, product numbers, and technical terms.

## Reranking

A reranking model can evaluate an initial set of retrieved results and reorder them according to relevance.

This can improve the quality of the final context supplied to the language model.

## Context Construction

The application combines retrieved passages into a controlled context.

The context should:
- Include relevant source material.
- Preserve useful document references.
- Avoid unnecessary duplication.
- Respect model context limits.
- Exclude unauthorized information.

## Grounded Generation

The model receives instructions to answer using the supplied context.

A well-designed application should also define what happens when the retrieved information is insufficient.

For example, the model may be instructed to state that the knowledge base does not contain enough information rather than inventing an answer.

## Citations and Source References

Enterprise AI applications should provide traceability where possible.

A response may identify:
- Source document.
- Article title.
- Section.
- Page number.
- Link to the approved source.

## Evaluation

RAG systems should be tested for:
- Retrieval relevance.
- Context precision.
- Context recall.
- Answer faithfulness.
- Citation accuracy.
- Response latency.

## Key Takeaway

Effective RAG requires more than vector search. Retrieval, ranking, context construction, grounded generation, and evaluation must work together.`
          },
          {
            type: 'check',
            question: 'What is the main purpose of reranking in a RAG pipeline?',
            options: [
              'To reorder retrieved results based on their relevance to the query.',
              'To permanently change the source documents.',
              'To disable semantic search.',
              'To replace all model security controls.'
            ],
            answer: 0,
            explanation: 'Reranking evaluates an initial retrieval result set and reorders it so that the most relevant passages are prioritized.'
          }
        ]
      }
    ]
  },

    // =========================================================
  // MODULE 7: ENTERPRISE INTEGRATION AND API ARCHITECTURE
  // =========================================================
  {
    id: 'enterprise-integration-and-api-architecture',
    title: 'Enterprise Integration and API Architecture',
    lessons: [
      {
        id: 'enterprise-integration-patterns',
        title: 'Enterprise Integration Patterns',
        minutes: 22,
        blocks: [
          {
            type: 'text',
            text: `# Enterprise Integration Patterns

## Introduction

Enterprise AI solutions rarely operate independently.

They must communicate with existing enterprise systems, including:

- Customer relationship management platforms.
- Enterprise resource planning systems.
- IT service management platforms.
- Human resources systems.
- Document management platforms.
- Identity providers.
- Data warehouses.

An enterprise architect must determine how these systems exchange information securely and reliably.

## Common Integration Patterns

### 1. Point-to-Point Integration

Two systems communicate directly.

Advantages:
- Simple to implement.
- Appropriate for small integrations.

Disadvantages:
- Creates tight coupling.
- Becomes difficult to maintain as integrations grow.

### 2. API-Based Integration

Applications communicate through defined APIs.

Advantages:
- Standardized interfaces.
- Reusable capabilities.
- Centralized authorization.
- Easier version management.

### 3. Event-Driven Integration

Systems publish events when something happens.

Other systems subscribe and react to those events.

Examples:
- A customer account is created.
- An employee changes departments.
- A service request is approved.
- A document is published.

### 4. Message-Based Integration

Messages are exchanged through queues or brokers.

This supports asynchronous processing and reduces dependencies between systems.

## Choosing an Integration Pattern

Consider:

- Business requirements.
- Response-time expectations.
- Transaction volume.
- Reliability.
- Data consistency.
- Security.
- Operational complexity.

## Enterprise AI Example

An AI assistant integrated with ServiceNow might:

1. Receive an employee request.
2. Identify the requested service.
3. Call an approved API.
4. Validate the user's permissions.
5. Submit a service request.
6. Return the request number.

The AI model should not bypass the enterprise application's authorization and business rules.

## Key Takeaway

Enterprise integration architecture establishes how AI solutions communicate with existing applications while preserving security, reliability, and maintainability.`
          },
          {
            type: 'check',
            question: 'Which integration pattern allows applications to communicate through reusable, standardized interfaces?',
            options: [
              'Direct database modification.',
              'API-based integration.',
              'Manual file copying.',
              'Unrestricted model access.'
            ],
            answer: 1,
            explanation: 'API-based integration provides standardized interfaces that support reuse, authorization, versioning, and controlled communication.'
          }
        ]
      },
      {
        id: 'api-design-versioning-and-security',
        title: 'API Design, Versioning, and Security',
        minutes: 24,
        blocks: [
          {
            type: 'text',
            text: `# API Design, Versioning, and Security

## Introduction

APIs provide controlled interfaces between enterprise applications and AI services.

A well-designed API should be predictable, secure, documented, and maintainable.

## API Design Principles

### 1. Define Clear Resources

Use meaningful resource names.

Examples:

- /employees
- /customers
- /service-requests
- /knowledge-articles

### 2. Use Appropriate HTTP Methods

Common methods include:

- GET: Retrieve information.
- POST: Create a resource or initiate an operation.
- PUT: Replace a resource.
- PATCH: Partially update a resource.
- DELETE: Remove a resource.

### 3. Validate Requests

Validate:

- Required fields.
- Data types.
- Input length.
- Allowed values.
- User permissions.

Never assume that an AI-generated request is valid.

## API Versioning

Enterprise APIs evolve over time.

Versioning helps maintain compatibility.

For example:

- /api/v1/employees
- /api/v2/employees

A new version may introduce additional fields or change response structures.

Avoid breaking existing integrations without a migration strategy.

## API Security

Important controls include:

### Authentication

Establish who or what is making the request.

### Authorization

Determine what the caller is permitted to do.

### Rate Limiting

Prevent excessive requests.

### Input Validation

Reject malformed or unexpected data.

### Audit Logging

Record important API operations.

### Encryption

Protect information in transit.

## API Gateway

An API gateway can provide:

- Request routing.
- Authentication enforcement.
- Rate limiting.
- Request validation.
- Traffic monitoring.
- Centralized API policies.

## Enterprise AI Example

An AI assistant wants to create a ServiceNow incident.

The integration service should:

1. Authenticate the user.
2. Verify authorization.
3. Validate the incident description and required fields.
4. Submit the request through an approved API.
5. Record the transaction.
6. Return the result.

The model should not receive unrestricted access to create or modify records.

## Key Takeaway

Secure API architecture provides a controlled boundary between AI applications and enterprise systems.`
          },
          {
            type: 'check',
            question: 'What is the primary purpose of API versioning?',
            options: [
              'To eliminate authentication.',
              'To prevent all API requests.',
              'To support API evolution while managing compatibility.',
              'To provide unrestricted database access.'
            ],
            answer: 2,
            explanation: 'API versioning allows interfaces to evolve while giving existing consumers a controlled path to maintain compatibility.'
          }
        ]
      },
      {
        id: 'integration-resilience-and-orchestration',
        title: 'Integration Resilience and Orchestration',
        minutes: 25,
        blocks: [
          {
            type: 'text',
            text: `# Integration Resilience and Orchestration

## Introduction

Enterprise AI systems depend on multiple services.

A failure in one external system should not necessarily cause the entire solution to fail.

Architecture must account for partial failures.

## Common Integration Failure Scenarios

Examples include:

- An API becomes unavailable.
- A downstream service responds slowly.
- An authentication token expires.
- A message cannot be processed.
- A database connection fails.
- A third-party model provider experiences an outage.

## Resilience Patterns

### 1. Timeout

Define how long a service should wait for a response.

Without timeouts, requests may remain blocked indefinitely.

### 2. Retry

Retry temporary failures using controlled policies.

Exponential backoff increases the waiting period between attempts.

### 3. Circuit Breaker

Temporarily stop sending requests to an unhealthy service.

This prevents repeated failures from overwhelming the system.

### 4. Dead-Letter Queue

Store messages that cannot be processed successfully.

They can be investigated and handled later.

### 5. Idempotency

Ensure that repeating an operation does not unintentionally create duplicate results.

This is especially important for payments, service requests, and other business transactions.

## Orchestration

Orchestration coordinates multiple services to complete a business process.

For example, an AI-powered employee onboarding workflow might:

1. Receive an approved onboarding request.
2. Create an employee record.
3. Request account provisioning.
4. Assign required training.
5. Notify the employee.
6. Record workflow completion.

Each operation should have defined inputs, outputs, permissions, and failure handling.

## Observability

Monitor:

- Request volume.
- Response times.
- Error rates.
- Failed transactions.
- Retry counts.
- Queue depth.
- Downstream service availability.

Use correlation IDs to trace a transaction across multiple services.

## Key Takeaway

Reliable enterprise AI integration requires resilience, orchestration, observability, and controlled failure recovery.`
          },
          {
            type: 'check',
            question: 'Which resilience pattern temporarily stops requests to a service that is repeatedly failing?',
            options: [
              'Circuit breaker.',
              'API versioning.',
              'Data normalization.',
              'Model fine-tuning.'
            ],
            answer: 0,
            explanation: 'A circuit breaker prevents repeated calls to an unhealthy service and gives it time to recover.'
          }
        ]
      }
    ]
  },

  // =========================================================
  // MODULE 8: MULTI-AGENT ENTERPRISE ARCHITECTURE
  // =========================================================
  {
    id: 'multi-agent-enterprise-architecture',
    title: 'Multi-Agent Enterprise Architecture',
    lessons: [
      {
        id: 'multi-agent-architecture-fundamentals',
        title: 'Multi-Agent Architecture Fundamentals',
        minutes: 24,
        blocks: [
          {
            type: 'text',
            text: `# Multi-Agent Architecture Fundamentals

## Introduction

An AI agent is a software system that can use an AI model to interpret objectives, make decisions, and perform actions through available tools.

A multi-agent architecture uses multiple agents that collaborate to complete a larger task.

Each agent may have a specialized responsibility.

## Single-Agent Architecture

A single agent handles the entire task.

For example, an employee assistant may:

- Understand a request.
- Search enterprise knowledge.
- Call an approved API.
- Generate a response.

This can work well for relatively straightforward workflows.

## Multi-Agent Architecture

A multi-agent solution separates responsibilities.

Consider an enterprise employee assistant.

It may contain:

### 1. Supervisor Agent

Receives the user's request and coordinates the workflow.

### 2. Knowledge Agent

Searches approved enterprise knowledge sources.

### 3. ITSM Agent

Interacts with approved IT service management APIs.

### 4. HR Agent

Handles authorized HR-related operations.

### 5. Compliance Agent

Checks requests against applicable policies.

### 6. Response Agent

Combines results into a clear response.

## Multi-Agent Communication

Agents may communicate through:

- Direct message passing.
- Shared state.
- Task queues.
- Workflow orchestration.
- Structured API contracts.

Communication should be explicit and controlled.

## When to Use Multiple Agents

Multi-agent architecture may be appropriate when:

- Tasks involve distinct business domains.
- Different tools require different permissions.
- Workflows require specialized reasoning.
- Responsibilities need independent monitoring.
- Teams need independently maintainable capabilities.

## When Not to Use Multiple Agents

Avoid unnecessary agents when a simpler workflow can accomplish the same task.

Additional agents introduce:

- More model calls.
- Higher cost.
- Increased latency.
- More complex debugging.
- Additional security boundaries.

## Key Takeaway

Multi-agent architecture can divide complex enterprise AI workflows into specialized responsibilities, but additional complexity must be justified by business value.`
          },
          {
            type: 'check',
            question: 'What is the primary architectural benefit of assigning specialized responsibilities to multiple agents?',
            options: [
              'Eliminating all security controls.',
              'Giving every agent unrestricted access.',
              'Separating complex workflows into specialized responsibilities.',
              'Removing the need for orchestration.'
            ],
            answer: 2,
            explanation: 'Specialized agents can divide complex workflows into manageable responsibilities with clearer boundaries and ownership.'
          }
        ]
      },
      {
        id: 'agent-coordination-and-workflow-orchestration',
        title: 'Agent Coordination and Workflow Orchestration',
        minutes: 25,
        blocks: [
          {
            type: 'text',
            text: `# Agent Coordination and Workflow Orchestration

## Introduction

Multiple agents require coordination.

Without clear coordination, agents may duplicate work, conflict, or produce inconsistent results.

## Coordination Patterns

### 1. Supervisor Pattern

A central supervisor receives requests and assigns work to specialized agents.

The supervisor:

- Interprets the objective.
- Selects the appropriate agent.
- Tracks task progress.
- Handles failures.
- Combines results.

### 2. Sequential Pattern

Agents execute tasks in a defined order.

Example:

1. Research agent retrieves information.
2. Analysis agent evaluates the information.
3. Response agent prepares the result.

### 3. Parallel Pattern

Multiple agents work on independent tasks simultaneously.

Example:

- One agent checks HR policies.
- Another checks IT policies.
- A third checks compliance requirements.

The results are combined after completion.

### 4. Hierarchical Pattern

A supervisor coordinates specialized sub-supervisors.

This may support larger enterprise workflows with multiple business domains.

## Workflow State

A coordinated workflow should maintain:

- Request identifier.
- Current workflow status.
- Assigned agent.
- Task inputs.
- Task outputs.
- Execution history.
- Approval status.
- Error information.

Use structured data rather than relying entirely on free-form conversation history.

## Human Approval

Some actions should require explicit human approval.

Examples:

- Financial transactions.
- Privileged account changes.
- Employee termination workflows.
- High-impact infrastructure changes.
- Sensitive data exports.

## Error Handling

Define what happens when:

- An agent fails.
- An agent returns invalid output.
- A downstream service is unavailable.
- An approval is rejected.
- A workflow exceeds its execution limit.

## Key Takeaway

Multi-agent orchestration requires explicit coordination, structured workflow state, failure handling, and human approval where appropriate.`
          },
          {
            type: 'check',
            question: 'Which coordination pattern uses a central agent to assign work to specialized agents?',
            options: [
              'Unmanaged collaboration.',
              'Supervisor pattern.',
              'Point-to-point database access.',
              'Static document storage.'
            ],
            answer: 1,
            explanation: 'The supervisor pattern uses a central coordinator to assign tasks, track progress, and combine results.'
          }
        ]
      },
      {
        id: 'agent-security-observability-and-governance',
        title: 'Agent Security, Observability, and Governance',
        minutes: 26,
        blocks: [
          {
            type: 'text',
            text: `# Agent Security, Observability, and Governance

## Introduction

Enterprise agents may access sensitive data and perform business operations.

Their capabilities must be governed through explicit security controls.

## Agent Identity

Each agent should have a clearly defined identity or execution context.

Avoid giving every agent the same broad permissions.

## Least Privilege

An agent should receive only the permissions required for its assigned responsibility.

For example:

- A knowledge agent may retrieve approved documents.
- An ITSM agent may create incidents through an approved API.
- An HR agent may retrieve only authorized employee information.
- A compliance agent may evaluate policy requirements.

## Tool Security

Tools provide agents with access to external capabilities.

Examples:

- Search APIs.
- Database services.
- Enterprise application APIs.
- Document repositories.
- Workflow services.

Controls should include:

- Authentication.
- Authorization.
- Input validation.
- Output validation.
- Rate limiting.
- Audit logging.

## Prompt Injection and Untrusted Content

Agents may process external documents, emails, and user-provided content.

Treat retrieved content as untrusted input.

A document must not be allowed to override system instructions or grant itself additional permissions.

## Human-in-the-Loop Controls

Require human approval for sensitive or high-impact operations.

Approval should occur before the protected action is executed.

## Observability

Monitor:

- Agent execution time.
- Model usage.
- Tool calls.
- Failed tasks.
- Workflow completion.
- Authorization failures.
- Token consumption.
- Human approval decisions.

Maintain traceability across the entire multi-agent workflow.

## Governance

Establish:

- Agent ownership.
- Approved use cases.
- Tool permissions.
- Data access policies.
- Model approval processes.
- Testing requirements.
- Change management.
- Incident response procedures.

## Key Takeaway

Enterprise multi-agent systems require identity, least privilege, controlled tools, observability, human oversight, and governance.`
          },
          {
            type: 'check',
            question: 'What is the most appropriate security principle when assigning permissions to enterprise agents?',
            options: [
              'Give every agent administrator access.',
              'Allow agents to modify their own permissions.',
              'Share one unrestricted identity across all agents.',
              'Apply least privilege based on each agent responsibility.'
            ],
            answer: 3,
            explanation: 'Least privilege limits each agent to the minimum permissions required for its assigned responsibilities.'
          }
        ]
      }
    ]
  },



  // =========================================================
  // MODULE 9: CLOUD ARCHITECTURE FOR ENTERPRISE AI
  // =========================================================
  {
    id: 'cloud-architecture-enterprise-ai',
    title: 'Cloud Architecture for Enterprise AI',
    lessons: [
      {
        id: 'cloud-platforms-and-ai-infrastructure',
        title: 'Cloud Platforms and AI Infrastructure',
        minutes: 22,
        blocks: [
          {
            type: 'text',
            text: `# Cloud Platforms and AI Infrastructure

## Introduction

Cloud platforms provide infrastructure and managed services for enterprise AI workloads.

They allow organizations to access computing, storage, networking, databases, and AI services without building every capability from scratch.

## Major Cloud Providers

Common enterprise cloud platforms include:

- Amazon Web Services (AWS).
- Microsoft Azure.
- Google Cloud Platform (GCP).

Each provides services for AI development, model hosting, data processing, and enterprise integration.

## Core Infrastructure Components

### Compute

Compute resources execute applications and AI workloads.

Examples include:
- Virtual machines.
- Containers.
- Kubernetes clusters.
- Serverless functions.
- GPU instances.

### Storage

Storage services hold documents, datasets, model artifacts, and application data.

### Networking

Networking connects applications, models, databases, and enterprise systems.

### Managed AI Services

Cloud providers offer managed services for:
- Model inference.
- Model training.
- Embedding generation.
- Document processing.
- AI application development.

## GPU Infrastructure

Graphics Processing Units accelerate many machine learning workloads.

GPU capacity is particularly important for training and serving large models.

However, not every AI application requires dedicated GPUs. Applications using hosted model APIs may not manage model-serving infrastructure directly.

## Cloud Architecture Decisions

Architects should evaluate:
- Workload requirements.
- Security and compliance.
- Geographic deployment.
- Availability.
- Performance.
- Cost.
- Operational skills.

## Key Takeaway

Cloud platforms provide the infrastructure and managed capabilities needed to build and operate enterprise AI solutions at scale.`
          },
          {
            type: 'check',
            question: 'Which infrastructure component is particularly important for accelerating many large-model training and inference workloads?',
            options: [
              'GPU compute',
              'DNS records',
              'Email storage',
              'Desktop monitors'
            ],
            answer: 0,
            explanation: 'GPUs accelerate many machine learning computations, although not every AI workload requires dedicated GPU infrastructure.'
          }
        ]
      },
      {
        id: 'cloud-networking-and-deployment-patterns',
        title: 'Cloud Networking and Deployment Patterns',
        minutes: 23,
        blocks: [
          {
            type: 'text',
            text: `# Cloud Networking and Deployment Patterns

## Introduction

Enterprise AI solutions require secure and reliable communication between applications, models, data platforms, and external services.

Cloud networking determines how these components communicate.

## Network Architecture

Important components include:

- Virtual networks.
- Subnets.
- Routing tables.
- Firewalls.
- Load balancers.
- Private endpoints.
- DNS services.
- Network monitoring.

## Public and Private Access

Public endpoints allow services to be reached over the public internet.

Private endpoints allow services to communicate through controlled private network connections.

Sensitive enterprise AI workloads may require private connectivity to databases, storage, and model services.

## Network Segmentation

Network segmentation separates systems according to their security requirements.

For example:

- Public-facing application services.
- Private application services.
- Restricted data services.
- Administrative infrastructure.

This reduces unnecessary connectivity between components.

## Deployment Patterns

### Virtual Machines

Virtual machines provide control over the operating system and runtime environment.

### Containers

Containers package applications and dependencies into portable deployment units.

### Kubernetes

Kubernetes orchestrates containerized workloads and supports scaling, service discovery, and workload management.

### Serverless

Serverless services allow organizations to execute code without managing the underlying server infrastructure directly.

## High Availability

AI services should be designed to handle infrastructure failures.

Possible approaches include:
- Multiple availability zones.
- Load balancing.
- Health checks.
- Automatic recovery.
- Redundant services.

## Disaster Recovery

Disaster recovery planning defines how services are restored following major failures.

Important considerations include recovery time objectives (RTO) and recovery point objectives (RPO).

## Key Takeaway

Secure cloud networking, appropriate deployment patterns, high availability, and disaster recovery are essential parts of production enterprise AI architecture.`
          },
          {
            type: 'check',
            question: 'Why might an enterprise use private network connectivity for an AI application?',
            options: [
              'To make every service publicly accessible.',
              'To reduce exposure of sensitive services and data to public networks.',
              'To eliminate authentication.',
              'To prevent internal services from communicating.'
            ],
            answer: 1,
            explanation: 'Private connectivity can reduce public network exposure and support controlled communication between sensitive enterprise services.'
          }
        ]
      },
      {
        id: 'cloud-cost-optimization-and-capacity-planning',
        title: 'Cloud Cost Optimization and Capacity Planning',
        minutes: 22,
        blocks: [
          {
            type: 'text',
            text: `# Cloud Cost Optimization and Capacity Planning

## Introduction

Enterprise AI workloads can generate significant infrastructure and model consumption costs.

Architects must design solutions that meet performance requirements while maintaining financial sustainability.

## Major AI Cost Drivers

Common cost drivers include:

- Model API consumption.
- Input and output tokens.
- GPU infrastructure.
- Storage.
- Network traffic.
- Data processing.
- Monitoring.
- Application hosting.

## Capacity Planning

Capacity planning estimates the resources required to support expected workloads.

Consider:
- Number of users.
- Requests per user.
- Average request size.
- Expected concurrency.
- Model response size.
- Peak usage periods.

## Model Cost Optimization

Possible approaches include:

- Selecting models appropriate to each workload.
- Using smaller models for simpler tasks.
- Limiting unnecessary context.
- Caching suitable responses.
- Reducing redundant model calls.
- Monitoring token consumption.

Caching must preserve data freshness and authorization requirements.

## Infrastructure Optimization

Organizations can evaluate:
- Autoscaling.
- Reserved capacity.
- Serverless execution.
- GPU utilization.
- Storage lifecycle policies.
- Workload scheduling.

## FinOps

FinOps is a collaborative approach to managing cloud spending.

It brings together finance, engineering, and business teams.

AI cost governance should include:
- Cost allocation.
- Budgets.
- Usage monitoring.
- Forecasting.
- Anomaly detection.
- Cost per business transaction.

## Example

An organization operates an AI assistant used by 20,000 employees.

The architect evaluates model usage, identifies unnecessary repeated calls, introduces suitable caching, and routes simple classification requests to a less expensive model.

The result is lower operating cost without sacrificing required business outcomes.

## Key Takeaway

Enterprise AI cost optimization requires visibility into model usage, infrastructure consumption, capacity requirements, and business value.`
          },
          {
            type: 'check',
            question: 'An enterprise AI application uses an expensive reasoning model for simple classification tasks. What is a sensible optimization?',
            options: [
              'Route every request to a larger model.',
              'Use an appropriately capable, lower-cost model for classification.',
              'Disable cost monitoring.',
              'Increase the number of unnecessary model calls.'
            ],
            answer: 1,
            explanation: 'Model routing can match workload complexity to model capability and cost.'
          }
        ]
      }
    ]
  },

  // =========================================================
  // MODULE 10: ENTERPRISE AI SECURITY AND GOVERNANCE
  // =========================================================
  {
    id: 'enterprise-ai-security-governance',
    title: 'Enterprise AI Security and Governance',
    lessons: [
      {
        id: 'enterprise-ai-threat-modeling',
        title: 'Enterprise AI Threat Modeling',
        minutes: 23,
        blocks: [
          {
            type: 'text',
            text: `# Enterprise AI Threat Modeling

## Introduction

Enterprise AI systems introduce security risks that extend beyond traditional application security.

Architects must evaluate risks involving models, prompts, tools, data sources, integrations, and users.

## AI Threat Surfaces

Common threat surfaces include:

- User input.
- Prompt construction.
- Model endpoints.
- Retrieval systems.
- External tools.
- Agent execution.
- Training and evaluation datasets.
- Logs and monitoring systems.

## Prompt Injection

Prompt injection occurs when malicious instructions are introduced through user input or retrieved content.

For example, a document might contain instructions intended to manipulate an AI assistant into disclosing restricted information.

Applications should treat retrieved content as untrusted data rather than automatically following instructions contained within it.

## Sensitive Data Exposure

An AI system may expose:
- Personal information.
- Financial records.
- Credentials.
- Internal business information.
- Restricted documents.

Data classification, access controls, and output validation help reduce this risk.

## Insecure Tool Execution

An agent may have access to tools that perform business actions.

Examples include:
- Creating incidents.
- Updating customer records.
- Initiating payments.
- Modifying infrastructure.

Tool permissions should follow least-privilege principles.

High-impact actions may require human approval.

## Model and Supply Chain Risks

Organizations should evaluate:
- Model provider security.
- Model provenance.
- Third-party dependencies.
- Data processing arrangements.
- Model version changes.
- Software vulnerabilities.

## Threat Modeling Process

A practical process includes:

1. Identify system assets.
2. Identify trust boundaries.
3. Identify entry points.
4. Identify potential threats.
5. Assess likelihood and impact.
6. Define mitigations.
7. Test controls.
8. Monitor residual risk.

## Key Takeaway

Enterprise AI threat modeling must consider the complete AI application, including its data, models, prompts, tools, integrations, and users.`
          },
          {
            type: 'check',
            question: 'An AI agent can modify production infrastructure. Which control is most appropriate for reducing the risk of unauthorized changes?',
            options: [
              'Give the agent unrestricted administrator access.',
              'Apply least privilege and require approval for high-impact actions.',
              'Disable audit logging.',
              'Allow the model to bypass application authorization.'
            ],
            answer: 1,
            explanation: 'Least privilege limits the agent to necessary permissions, while approval controls add oversight for high-impact operations.'
          }
        ]
      },
      {
        id: 'identity-access-and-data-protection',
        title: 'Identity, Access Management, and Data Protection',
        minutes: 22,
        blocks: [
          {
            type: 'text',
            text: `# Identity, Access Management, and Data Protection

## Introduction

Enterprise AI applications must preserve organizational identity and authorization boundaries.

An AI assistant should not gain access to information simply because it can generate a response about that information.

## Authentication

Authentication establishes the identity of a user or service.

Common enterprise approaches include:
- Single sign-on.
- Multi-factor authentication.
- OAuth 2.0.
- OpenID Connect.
- Service identities.

## Authorization

Authorization determines what an authenticated identity is permitted to do.

Common approaches include:

### Role-Based Access Control

RBAC assigns permissions through roles.

### Attribute-Based Access Control

ABAC evaluates attributes such as department, location, classification, and user context.

### Resource-Level Authorization

Controls access to individual records, documents, and resources.

## Identity Propagation

When an application calls an AI service, it should preserve the relevant user identity and authorization context.

The retrieval and tool services must evaluate the permissions of the requesting user.

## Data Protection

Important controls include:

- Encryption in transit.
- Encryption at rest.
- Secrets management.
- Data minimization.
- Data masking.
- Retention controls.
- Secure deletion.

## Secrets Management

API keys, service credentials, and other secrets should be stored in approved secrets management systems.

They should not be embedded in frontend code, prompts, or source repositories.

## Tenant Isolation

Multi-tenant AI platforms must prevent one organization from accessing another organization's information.

Controls may include:
- Tenant-scoped data queries.
- Tenant-aware authorization.
- Isolated storage.
- Organization-specific configuration.
- Audit logging.

## Example

An enterprise AI platform serves multiple organizations.

Each request contains authenticated identity and organization context.

The retrieval service verifies membership and document permissions before returning information.

## Key Takeaway

Identity, authorization, encryption, secrets management, and tenant isolation must be enforced throughout the enterprise AI architecture.`
          },
          {
            type: 'check',
            question: 'In a multi-tenant AI platform, what is the purpose of tenant isolation?',
            options: [
              'To allow every tenant to read all other tenant records.',
              'To prevent unauthorized access to information belonging to other organizations.',
              'To eliminate authentication.',
              'To share all credentials across organizations.'
            ],
            answer: 1,
            explanation: "Tenant isolation ensures that one organization's users and applications cannot access another organization's protected information."
          }
        ]
      },
      {
        id: 'ai-governance-compliance-and-human-oversight',
        title: 'AI Governance, Compliance, and Human Oversight',
        minutes: 24,
        blocks: [
          {
            type: 'text',
            text: `# AI Governance, Compliance, and Human Oversight

## Introduction

AI governance establishes the policies, responsibilities, and controls used to manage AI systems throughout their lifecycle.

Enterprise AI governance should address business value, risk, accountability, transparency, and compliance.

## Governance Responsibilities

An enterprise governance program may define:

- Approved AI use cases.
- Model approval requirements.
- Data handling policies.
- Risk assessments.
- Testing standards.
- Human oversight.
- Monitoring requirements.
- Incident response.
- Retirement procedures.

## AI Risk Management

Organizations should evaluate risks according to:
- Potential harm.
- Likelihood.
- Business impact.
- Regulatory exposure.
- Data sensitivity.
- Operational dependency.

Risk assessments should be performed before deployment and revisited when systems change.

## AI Lifecycle Governance

Governance should cover:

1. Use-case identification.
2. Risk classification.
3. Design approval.
4. Data preparation.
5. Model evaluation.
6. Deployment approval.
7. Production monitoring.
8. Change management.
9. Retirement.

## Human Oversight

Human oversight is particularly important when AI decisions may have significant consequences.

Examples include:
- Employment decisions.
- Financial decisions.
- Healthcare recommendations.
- Legal decisions.
- Security-sensitive operations.

Human review should be meaningful and supported by sufficient information.

## Documentation and Auditability

Organizations should maintain records of:
- Model versions.
- Data sources.
- Prompts and configurations.
- Evaluation results.
- Approval decisions.
- System changes.
- Significant AI actions.

## Governance Frameworks

Organizations may use established risk management and governance frameworks as references.

Examples include:
- NIST AI Risk Management Framework.
- ISO/IEC 42001.
- Applicable privacy and data protection regulations.

Framework selection should reflect the organization's industry, jurisdiction, and risk profile.

## Key Takeaway

Enterprise AI governance establishes accountability and lifecycle controls so that AI systems remain appropriate, secure, transparent, and manageable.`
          },
          {
            type: 'check',
            question: 'Why should an organization maintain AI model and configuration version records?',
            options: [
              'To eliminate the need for testing.',
              'To support traceability, audits, change management, and incident investigation.',
              'To allow unapproved production changes.',
              'To guarantee that a model never produces an error.'
            ],
            answer: 1,
            explanation: 'Version records help organizations understand which model and configuration produced an outcome and support controlled change management.'
          }
        ]
      }
    ]
  },

  // =========================================================
  // MODULE 11: ENTERPRISE AI SOLUTIONS ARCHITECTURE CAPSTONE
  // =========================================================
  {
    id: 'enterprise-ai-architecture-capstone',
    title: 'Enterprise AI Solutions Architecture Capstone',
    lessons: [
      {
        id: 'capstone-business-discovery-and-requirements',
        title: 'Capstone: Business Discovery and Requirements',
        minutes: 24,
        blocks: [
          {
            type: 'text',
            text: `# Capstone: Business Discovery and Requirements

## Scenario

You are the enterprise solutions architect for a large organization.

Leadership wants to introduce an AI-powered employee assistant.

The assistant should help employees:
- Search internal policies.
- Find IT support instructions.
- Understand business procedures.
- Submit approved service requests.
- Receive answers with source references.

The solution must support multiple departments and enforce existing access permissions.

## Step 1: Define Business Objectives

Start by documenting measurable outcomes.

Potential objectives include:
- Reduce time spent searching for information.
- Improve employee self-service.
- Reduce repetitive support requests.
- Improve access to approved knowledge.
- Increase consistency of policy responses.

## Step 2: Identify Stakeholders

Potential stakeholders include:

- Business sponsor.
- Enterprise architecture.
- Information security.
- Data governance.
- IT operations.
- HR.
- Legal and compliance.
- Application owners.
- End users.

## Step 3: Define Functional Requirements

Examples:

1. Users can ask questions in natural language.
2. The system retrieves approved enterprise information.
3. Answers include source references.
4. Users can submit approved service requests.
5. Restricted information remains protected.
6. Uncertain answers can be escalated.

## Step 4: Define Nonfunctional Requirements

Define requirements for:
- Availability.
- Response latency.
- Scalability.
- Security.
- Privacy.
- Auditability.
- Cost.
- Maintainability.

## Step 5: Define Acceptance Criteria

Examples:

- Only authorized documents are retrieved.
- Answers provide traceable sources where applicable.
- Restricted actions require authorization.
- Failed integrations produce controlled errors.
- Usage and performance are monitored.

## Architecture Deliverable

Create a requirements matrix connecting each business requirement to an architecture component and a validation method.

## Key Takeaway

A successful enterprise AI architecture begins with business discovery, stakeholder alignment, measurable requirements, and explicit acceptance criteria.`
          },
          {
            type: 'check',
            question: 'What should an enterprise architect establish before selecting the AI technology for the capstone solution?',
            options: [
              'The largest available model.',
              'Business objectives, stakeholders, requirements, and success measures.',
              'The final user interface colors.',
              'A production deployment without testing.'
            ],
            answer: 1,
            explanation: 'Architecture decisions should be driven by business needs and measurable requirements rather than technology selection alone.'
          }
        ]
      },
      {
        id: 'capstone-target-architecture-and-security',
        title: 'Capstone: Target Architecture and Security Design',
        minutes: 25,
        blocks: [
          {
            type: 'text',
            text: `# Capstone: Target Architecture and Security Design

## Introduction

The next step is to translate the approved requirements into a target architecture.

## Proposed Architecture

The employee assistant may include the following components:

### 1. Experience Layer

An employee portal or enterprise application provides the user interface.

### 2. Identity and Access Layer

The enterprise identity provider authenticates users and provides identity context.

### 3. API Gateway

The gateway validates requests, applies rate limits, and routes application traffic.

### 4. AI Orchestration Service

The orchestration service manages prompts, model calls, retrieval, and tool execution.

### 5. Retrieval Service

The retrieval service searches approved enterprise knowledge sources.

### 6. Model Service

An approved language model generates responses using the retrieved context.

### 7. Enterprise Integration Layer

Integration services connect to systems such as ITSM, HR, and document management platforms.

### 8. Data Layer

Document storage, search indexes, databases, and metadata services provide enterprise information.

### 9. Security and Monitoring

Cross-cutting services provide authorization, audit logging, monitoring, and policy enforcement.

## Security Design

The solution should enforce:

- User authentication.
- Document-level authorization.
- Tenant or organizational boundaries where applicable.
- Encryption.
- Secrets management.
- Input validation.
- Output validation.
- Tool-level permissions.
- Human approval for restricted actions.

## RAG Design

The knowledge pipeline should:

1. Ingest approved documents.
2. Extract text.
3. Create chunks.
4. Generate embeddings.
5. Preserve document metadata.
6. Index content.
7. Enforce authorization during retrieval.

## Integration Design

Business systems should be accessed through approved APIs and integration services.

The AI model should not receive unrestricted direct database access.

## Architecture Deliverables

Produce:
- Logical architecture diagram.
- Component descriptions.
- Data flow.
- Integration inventory.
- Security control matrix.
- Deployment model.

## Key Takeaway

A target architecture connects experience, identity, orchestration, models, knowledge, integrations, infrastructure, and security into one coherent design.`
          },
          {
            type: 'check',
            question: 'Why should enterprise integrations be mediated through controlled APIs and services rather than unrestricted model access to databases?',
            options: [
              'To allow models to bypass authorization.',
              'To enforce validation, authorization, business rules, and auditability.',
              'To eliminate integration documentation.',
              'To prevent monitoring.'
            ],
            answer: 1,
            explanation: 'Controlled APIs and services enforce business rules and security policies while providing a traceable integration boundary.'
          }
        ]
      },
      {
        id: 'capstone-architecture-validation-and-presentation',
        title: 'Capstone: Architecture Validation and Presentation',
        minutes: 26,
        blocks: [
          {
            type: 'text',
            text: `# Capstone: Architecture Validation and Presentation

## Introduction

An architecture is not complete when its diagrams are finished.

The architect must validate that the proposed solution meets business, technical, security, and operational requirements.

## Architecture Validation

Evaluate the design against its quality attributes.

### Performance

Test:
- Response latency.
- Concurrent requests.
- Retrieval performance.
- Model throughput.

### Reliability

Test:
- Model provider outages.
- Integration failures.
- Database unavailability.
- Retry behavior.
- Recovery procedures.

### Security

Validate:
- Authentication.
- Authorization.
- Tenant isolation.
- Data protection.
- Prompt injection defenses.
- Tool permissions.

### AI Quality

Evaluate:
- Answer relevance.
- Grounding.
- Citation accuracy.
- Hallucination rates.
- Refusal behavior.
- Human escalation.

### Cost

Estimate:
- Model consumption.
- Infrastructure.
- Storage.
- Network usage.
- Operational support.

## Architecture Decision Records

Document important decisions, including:

- Decision context.
- Options considered.
- Selected approach.
- Rationale.
- Tradeoffs.
- Consequences.

## Operational Readiness

Before production, define:

- Monitoring dashboards.
- Alert thresholds.
- Incident procedures.
- Support ownership.
- Change management.
- Model update procedures.
- Backup and recovery.
- Service-level objectives.

## Final Architecture Presentation

Present the architecture to stakeholders.

A strong presentation should explain:

1. The business problem.
2. The proposed solution.
3. The architecture components.
4. Data flows and integrations.
5. Security and governance.
6. Deployment and operations.
7. Risks and tradeoffs.
8. Implementation roadmap.
9. Estimated costs.
10. Expected business value.

## Final Deliverable

Produce an enterprise AI architecture proposal that includes:

- Business requirements.
- Logical architecture.
- Technology choices.
- Security model.
- Data architecture.
- Integration design.
- Deployment strategy.
- Governance controls.
- Risks and mitigations.
- Implementation phases.

## Key Takeaway

Enterprise AI solutions architecture requires the ability to connect business strategy, technology design, security, governance, implementation, and operational readiness.`
          },
          {
            type: 'check',
            question: 'What is the primary purpose of architecture validation before production deployment?',
            options: [
              'To confirm the solution meets its functional, quality, security, and operational requirements.',
              'To avoid documenting architecture decisions.',
              'To eliminate stakeholder reviews.',
              'To deploy without testing.'
            ],
            answer: 0,
            explanation: 'Architecture validation provides evidence that the proposed solution meets its requirements and is ready for controlled production operation.'
          }
        ]
      }
    ]
  }
]

// =========================================================
// COURSE VALIDATION
// =========================================================

function validateCourse() {
  const errors = [];

  if (MODULES.length !== 11) {
    errors.push(
      `Expected 11 modules, found ${MODULES.length}.`
    );
  }

  const moduleIds = new Set();
  const lessonIds = new Set();

  let totalLessons = 0;
  let totalMinutes = 0;

  for (const [moduleIndex, module] of MODULES.entries()) {
    if (!module.id || !module.title) {
      errors.push(
        `Module ${moduleIndex + 1} is missing an ID or title.`
      );
    }

    if (moduleIds.has(module.id)) {
      errors.push(`Duplicate module ID: ${module.id}`);
    }

    moduleIds.add(module.id);

    if (!Array.isArray(module.lessons)) {
      errors.push(
        `Module ${module.id} does not contain a lessons array.`
      );
      continue;
    }

    for (const [lessonIndex, lesson] of module.lessons.entries()) {
      totalLessons++;

      if (!lesson.id || !lesson.title) {
        errors.push(
          `Invalid lesson in module ${module.id}, position ${lessonIndex + 1}.`
        );
      }

      if (lessonIds.has(lesson.id)) {
        errors.push(`Duplicate lesson ID: ${lesson.id}`);
      }

      lessonIds.add(lesson.id);

      if (
        !Number.isFinite(lesson.minutes) ||
        lesson.minutes <= 0
      ) {
        errors.push(
          `Invalid duration for lesson ${lesson.id}.`
        );
      } else {
        totalMinutes += lesson.minutes;
      }

      if (!Array.isArray(lesson.blocks) || lesson.blocks.length === 0) {
        errors.push(
          `Lesson ${lesson.id} has no content blocks.`
        );
        continue;
      }

      const checks = lesson.blocks.filter(
        block => block.type === 'check'
      );

      if (checks.length !== 1) {
        errors.push(
          `Lesson ${lesson.id} must contain exactly one Quick Check.`
        );
      }

      for (const block of lesson.blocks) {
        if (block.type === 'text') {
          if (
            typeof block.text !== 'string' ||
            block.text.trim().length === 0
          ) {
            errors.push(
              `Lesson ${lesson.id} contains an empty text block.`
            );
          }
        }

        if (block.type === 'check') {
          if (
            typeof block.question !== 'string' ||
            !block.question.trim()
          ) {
            errors.push(
              `Quick Check in ${lesson.id} has no question.`
            );
          }

          if (
            !Array.isArray(block.options) ||
            block.options.length !== 4
          ) {
            errors.push(
              `Quick Check in ${lesson.id} must have four options.`
            );
          }

          if (
            !Number.isInteger(block.answer) ||
            block.answer < 0 ||
            block.answer > 3
          ) {
            errors.push(
              `Quick Check in ${lesson.id} has an invalid answer index.`
            );
          }

          if (
            typeof block.explanation !== 'string' ||
            !block.explanation.trim()
          ) {
            errors.push(
              `Quick Check in ${lesson.id} has no explanation.`
            );
          }
        }
      }
    }
  }

  if (totalLessons !== 33) {
    errors.push(
      `Expected 33 lessons, found ${totalLessons}.`
    );
  }

  if (errors.length > 0) {
    console.error('\nCOURSE VALIDATION FAILED\n');

    for (const error of errors) {
      console.error(`- ${error}`);
    }

    throw new Error(
      `Course validation failed with ${errors.length} error(s).`
    );
  }

  console.log('\nCOURSE VALIDATION PASSED');
  console.log('------------------------------');
  console.log(`Modules: ${MODULES.length}`);
  console.log(`Lessons: ${totalLessons}`);
  console.log(`Quick Checks: ${totalLessons}`);
  console.log(`Duration: ${totalMinutes} minutes`);
  console.log(
    `Duration: ${(totalMinutes / 60).toFixed(2)} hours`
  );

  return {
    totalModules: MODULES.length,
    totalLessons,
    totalMinutes,
  };
}

// =========================================================
// FIRESTORE SEEDING
// =========================================================

async function seedCourse() {
  console.log('\nENTERPRISE AI ARCHITECTURE SEED');
  console.log('================================');

  const totals = validateCourse();

  console.log(`Course: ${COURSE.title}`);
  console.log(`Course ID: ${COURSE.id}`);
  console.log(`Project: ${PROJECT_ID}`);

  console.log(
    `Mode: ${APPLY ? 'APPLY' : 'DRY RUN'}`
  );

  const courseRef = db.collection('courses').doc(COURSE.id);

  const existingCourse = await courseRef.get();

  if (existingCourse.exists && !OVERWRITE) {
    throw new Error(
      `Course "${COURSE.id}" already exists. ` +
      'Use --overwrite if you intentionally want to replace it.'
    );
  }

  const existingLessonsSnapshot = await courseRef
    .collection('lessons')
    .get();

  if (existingLessonsSnapshot.size > 0 && !OVERWRITE) {
    throw new Error(
      `Found ${existingLessonsSnapshot.size} existing lessons. ` +
      'Use --overwrite if you intentionally want to replace them.'
    );
  }

  if (!APPLY) {
    console.log('\nDRY RUN COMPLETE');
    console.log('------------------------------');
    console.log('No Firestore changes were made.');
    console.log('Run with --apply to write the course.');
    return;
  }

  const batch = db.batch();

  const courseData = {
    ...COURSE,

    modules: MODULES.map((module, moduleIndex) => ({
  id: module.id,
  title: module.title,
  order: moduleIndex + 1,

  lessons: module.lessons.map((lesson, lessonIndex) => ({
    id: lesson.id,
    title: lesson.title,
    order: lessonIndex + 1,
    minutes: lesson.minutes,
    hasCheck: lesson.blocks.some(block => block.type === 'check'),
  })),
})),

    totalModules: totals.totalModules,
    totalLessons: totals.totalLessons,
    totalMinutes: totals.totalMinutes,

    status: 'draft',

    createdAt: existingCourse.exists
      ? existingCourse.data().createdAt || FieldValue.serverTimestamp()
      : FieldValue.serverTimestamp(),

    updatedAt: FieldValue.serverTimestamp(),
  };

  batch.set(courseRef, courseData, { merge: true });

  if (OVERWRITE) {
    existingLessonsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
  }

  let lessonOrder = 0;

  for (const [moduleIndex, module] of MODULES.entries()) {
    for (const lesson of module.lessons) {
      lessonOrder++;

      const lessonRef = courseRef
        .collection('lessons')
        .doc(lesson.id);

      const lessonData = {
        id: lesson.id,
        title: lesson.title,

        moduleId: module.id,
        moduleTitle: module.title,

        order: lessonOrder,
        moduleOrder: moduleIndex + 1,

        minutes: lesson.minutes,
        blocks: lesson.blocks,

        status: 'draft',

        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      batch.set(lessonRef, lessonData, { merge: true });
    }
  }

  await batch.commit();

  console.log('\nCOURSE SEEDED SUCCESSFULLY');
  console.log('------------------------------');
  console.log(`Course: ${COURSE.title}`);
  console.log(`Modules: ${totals.totalModules}`);
  console.log(`Lessons: ${totals.totalLessons}`);
  console.log(`Quick Checks: ${totals.totalLessons}`);
  console.log(`Duration: ${totals.totalMinutes} minutes`);
  console.log('Status: draft');
  console.log('\nFirestore location:');
  console.log(`courses/${COURSE.id}`);
  console.log(
    `courses/${COURSE.id}/lessons/{lessonId}`
  );
}

// =========================================================
// EXECUTION
// =========================================================

seedCourse().catch(error => {
  console.error('\nCOURSE SEED FAILED');
  console.error(error);
  process.exitCode = 1;
});