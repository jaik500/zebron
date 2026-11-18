/**
 * Cloud Architecture for AI Solutions
 * Program: Enterprise AI & Solutions Architecture, step 8
 *
 * Dry run (checks the content, writes nothing):
 *   node scripts/enterprise-ai-architecture/cloud-architecture-ai-solutions/seed-cloud-architecture-ai-solutions.mjs
 * Create the course:
 *   node scripts/enterprise-ai-architecture/cloud-architecture-ai-solutions/seed-cloud-architecture-ai-solutions.mjs --apply
 * Update an existing course (keeps its status, publish date and final exam):
 *   node scripts/enterprise-ai-architecture/cloud-architecture-ai-solutions/seed-cloud-architecture-ai-solutions.mjs --apply --overwrite
 *
 * Lesson text uses the light Markdown lessons support: # / ## / ### headings,
 * - and 1. lists, **bold**, *italic*, `code`, ``` code blocks, > quotes and
 * | tables |. Each text block is one section in the lesson player; its first
 * heading is the section title.
 */

import { runCourseSeed } from '../../lib/write-zebron-course.mjs';

const COURSE = {
  id: "cloud-architecture-ai-solutions",
  title: "Cloud Architecture for AI Solutions",
  summary: "Design, deploy, secure, and operate scalable cloud infrastructure for enterprise AI systems.",
  description: "Develop the skills to architect production-ready cloud environments for enterprise AI solutions. Learn cloud infrastructure, compute, networking, storage, AI accelerators, managed AI platforms, containerization, security, high availability, disaster recovery, cloud operations, and FinOps.",
  topic: "Cloud Computing",
  program: "Enterprise AI & Solutions Architecture",
  programOrder: 8,
  level: "advanced",
  cover: "sky",
  outcomes: [
    "Explain cloud architecture principles and deployment models.",
    "Design compute, networking, and storage architectures for AI workloads.",
    "Evaluate CPUs, GPUs, and specialized AI accelerators.",
    "Select appropriate managed AI and foundation model services.",
    "Design containerized and Kubernetes-based AI deployments.",
    "Apply cloud identity, network, and data security controls.",
    "Design highly available cloud solutions and disaster recovery strategies.",
    "Implement cloud monitoring, automation, and FinOps practices.",
    "Develop and defend secure, scalable enterprise AI cloud architectures.",
  ],
  skills: [
    "Cloud Architecture",
    "AWS",
    "Microsoft Azure",
    "Google Cloud",
    "Cloud Networking",
    "Cloud Storage",
    "AI Infrastructure",
    "GPU Computing",
    "Docker",
    "Kubernetes",
    "Cloud Security",
    "Identity and Access Management",
    "Disaster Recovery",
    "Cloud Monitoring",
    "FinOps",
    "Enterprise AI Architecture",
  ],
};

const MODULES = [
  {
    id: "cloud-architecture-foundations",
    title: "Cloud Architecture Foundations",
    lessons: [
      {
        id: "cloud-computing-fundamentals",
        title: "Understanding Cloud Computing",
        minutes: 6,
        blocks: [
          {
            type: 'video',
            url: "https://firebasestorage.googleapis.com/v0/b/zebron-2b49f.firebasestorage.app/o/course-videos%2Fcloud-architecture-ai-solutions-overview.mp4?alt=media&token=2fd77e35-e48b-4c56-b06b-df7cb25c32da",
            caption: "Course overview: what you will learn, the modules and the skills you will build (about 50 seconds, no sound).",
          },
          {
            type: 'text',
            text: `# Understanding Cloud Computing

## Introduction

Cloud computing provides on-demand access to computing resources over a network.

Instead of purchasing and maintaining every server, storage device, and networking component, organizations can consume infrastructure and services from cloud providers.

Cloud computing has become a foundation for modern enterprise applications and artificial intelligence platforms.

## What Is Cloud Computing?

Cloud computing provides access to resources such as:

- Virtual machines.
- Storage.
- Databases.
- Networking.
- Application hosting.
- Containers.
- Artificial intelligence services.
- Monitoring and security services.

Organizations typically pay for the resources they consume.

## Characteristics of Cloud Computing

### 1. On-Demand Self-Service

Users can provision resources when needed without manually requesting physical infrastructure.

### 2. Broad Network Access

Cloud services are accessible through standard network connections and interfaces.

### 3. Resource Pooling

Cloud providers share underlying infrastructure across multiple customers while maintaining logical isolation.

### 4. Rapid Elasticity

Resources can scale up or down based on demand.

### 5. Measured Service

Resource consumption can be monitored and billed according to usage.

## Cloud Service Models

Three major service models are commonly used.

### Infrastructure as a Service (IaaS)

The provider supplies infrastructure such as:

- Virtual machines.
- Networking.
- Storage.
- Virtualized computing resources.

The customer manages operating systems, applications, and much of the configuration.

Examples include:

- Amazon EC2.
- Azure Virtual Machines.
- Google Compute Engine.

### Platform as a Service (PaaS)

The provider manages much of the underlying infrastructure and application runtime.

Developers focus primarily on application code and configuration.

Examples include:

- Azure App Service.
- Google App Engine.
- Managed application platforms.

### Software as a Service (SaaS)

The provider delivers a complete application.

Customers use the application without managing its underlying infrastructure.

Examples include:

- Microsoft 365.
- Salesforce.
- ServiceNow.

## Cloud Computing and AI

AI solutions use cloud services for:

- Model training.
- Model inference.
- Data processing.
- Vector databases.
- Object storage.
- Distributed computing.
- Application hosting.

A cloud architect must determine which responsibilities belong to the cloud provider and which remain with the organization.

## Key Takeaway

Cloud computing provides flexible access to infrastructure and application services. Understanding service models is essential when designing enterprise AI platforms.`,
          },
          {
            type: 'check',
            question: "Which cloud service model gives customers virtual machines, storage, and networking while leaving operating system management largely to the customer?",
            options: [
              "Infrastructure as a Service.",
              "Platform as a Service (PaaS).",
              "Software as a Service (SaaS).",
              "Function as a Service (FaaS).",
            ],
            answer: 0,
            explanation: "Infrastructure as a Service provides virtualized infrastructure while the customer remains responsible for operating systems, applications, and many configuration decisions.",
          },
        ],
      },
      {
        id: "cloud-deployment-models",
        title: "Public, Private, Hybrid, and Multi-Cloud",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Public, Private, Hybrid, and Multi-Cloud

## Introduction

Organizations must decide where their applications, data, and infrastructure will operate.

This decision influences security, cost, availability, compliance, and operational complexity.

## Public Cloud

Public cloud services are delivered through infrastructure operated by a cloud provider.

Examples include:

- Amazon Web Services.
- Microsoft Azure.
- Google Cloud Platform.

Advantages:

- Rapid provisioning.
- Global infrastructure.
- Broad service catalogs.
- Flexible consumption models.
- Access to managed AI services.

Considerations:

- Shared responsibility for security.
- Data residency requirements.
- Cost management.
- Vendor dependency.

## Private Cloud

A private cloud environment is dedicated to one organization.

It may operate:

- In an organization's data center.
- In a hosted facility.
- Through a dedicated cloud environment.

Advantages:

- Greater infrastructure control.
- Custom security configurations.
- Support for specialized regulatory requirements.

Considerations:

- Infrastructure ownership.
- Maintenance responsibilities.
- Capacity planning.
- Higher operational overhead.

## Hybrid Cloud

Hybrid cloud combines private infrastructure with public cloud services.

For example:

An organization may keep sensitive business systems in its private environment while deploying an AI inference service in a public cloud.

Hybrid architecture requires careful consideration of:

- Network connectivity.
- Identity federation.
- Data movement.
- Security boundaries.
- Monitoring.
- Integration.

## Multi-Cloud

Multi-cloud uses services from multiple cloud providers.

For example:

- AWS for application infrastructure.
- Azure for enterprise identity integration.
- Google Cloud for selected AI services.

Potential benefits:

- Provider flexibility.
- Access to specialized services.
- Geographic coverage.
- Reduced dependence on one provider.

Potential challenges:

- Different service architectures.
- Multiple billing systems.
- Operational complexity.
- Identity integration.
- Skills and support requirements.

## Choosing a Deployment Model

An enterprise architect should evaluate:

1. Business requirements.
2. Security requirements.
3. Regulatory obligations.
4. Data residency.
5. Existing infrastructure.
6. Application dependencies.
7. Availability requirements.
8. Financial considerations.
9. Operational capabilities.

## Enterprise AI Example

A financial organization may use a hybrid architecture:

- Private infrastructure for sensitive records.
- Public cloud for approved AI model hosting.
- Encrypted connectivity between environments.
- Centralized identity and monitoring.

The design must enforce authorization across both environments.

## Key Takeaway

Public, private, hybrid, and multi-cloud models provide different tradeoffs. The correct deployment model depends on business, security, regulatory, and operational requirements.`,
          },
          {
            type: 'check',
            question: "Which deployment model combines private infrastructure with public cloud services?",
            options: [
              "Multi-cloud.",
              "Hybrid cloud.",
              "Public cloud.",
              "Private cloud.",
            ],
            answer: 1,
            explanation: "Hybrid cloud combines private infrastructure with public cloud services, allowing organizations to distribute workloads according to their requirements.",
          },
        ],
      },
      {
        id: "cloud-shared-responsibility-and-architecture",
        title: "Cloud Shared Responsibility and Architecture Principles",
        minutes: 7,
        blocks: [
          {
            type: 'text',
            text: `# Cloud Shared Responsibility and Architecture Principles

## Introduction

Moving workloads to the cloud does not eliminate an organization's security and operational responsibilities.

Cloud providers and customers share responsibility for protecting systems and data.

The exact division depends on the service model.

## The Shared Responsibility Model

Cloud providers generally manage responsibilities associated with their underlying infrastructure.

These may include:

- Physical data center security.
- Physical networking.
- Hardware maintenance.
- Underlying virtualization infrastructure.

Customers remain responsible for appropriate configuration and use of cloud services.

Depending on the service, customer responsibilities may include:

- Identity and access management.
- Application security.
- Data classification.
- Network configuration.
- Encryption configuration.
- Security monitoring.
- Access reviews.

## Shared Responsibility Across Service Models

### Infrastructure as a Service

The provider manages physical infrastructure and virtualization.

The customer generally manages:

- Operating systems.
- Applications.
- Network security configurations.
- Identity permissions.
- Data protection.

### Platform as a Service

The provider manages additional platform components.

The customer focuses on:

- Application configuration.
- Application security.
- Identity.
- Data.
- Access policies.

### Software as a Service

The provider manages most application infrastructure.

The customer still manages:

- User access.
- Role assignments.
- Data governance.
- Application configuration.
- Appropriate information sharing.

## Architecture Principles

Enterprise cloud architectures should follow several principles.

### 1. Security by Design

Security should be incorporated during architecture design rather than added after deployment.

### 2. Least Privilege

Users and services should receive only the permissions required for their responsibilities.

### 3. Scalability

Infrastructure should support changing workloads.

### 4. Resilience

Applications should tolerate failures and recover predictably.

### 5. Automation

Use infrastructure as code and automated deployment processes where appropriate.

### 6. Observability

Monitor application health, infrastructure performance, security events, and cost.

### 7. Cost Awareness

Evaluate infrastructure cost as an architectural quality attribute.

## Cloud Architecture Frameworks

Cloud providers publish architecture frameworks and best practices.

Examples include:

- AWS Well-Architected Framework.
- Microsoft Azure Well-Architected Framework.
- Google Cloud Architecture Framework.

These frameworks help architects evaluate:

- Security.
- Reliability.
- Performance.
- Operational excellence.
- Cost optimization.
- Sustainability.

## Enterprise AI Example

An organization deploys an AI application using managed cloud services.

Even if the provider manages the model infrastructure, the organization remains responsible for:

- Who can access the application.
- Which documents can be retrieved.
- How sensitive data is handled.
- Which tools the AI agent can invoke.
- How usage is monitored.
- How incidents are handled.

## Key Takeaway

Cloud architecture requires a clear understanding of shared responsibility and consistent architectural principles. Managed services reduce operational responsibilities but do not eliminate organizational accountability.`,
          },
          {
            type: 'check',
            question: "When using a managed cloud service, who remains responsible for configuring appropriate user access and protecting organizational data?",
            options: [
              "The cloud provider, under its service agreement.",
              "The vendor of the managed service's software.",
              "The provider and customer equally, by default.",
              "The customer organization.",
            ],
            answer: 3,
            explanation: "Cloud providers and customers share responsibility. Customers remain accountable for appropriate access configuration, data protection, and secure use of cloud services.",
          },
        ],
      },
    ],
  },
  {
    id: "cloud-compute-architecture",
    title: "Cloud Compute Architecture",
    lessons: [
      {
        id: "virtual-machines-and-compute-resources",
        title: "Virtual Machines and Cloud Compute Resources",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Virtual Machines and Cloud Compute Resources

## Introduction

Compute infrastructure provides the processing capacity required to run applications.

Enterprise AI systems require compute resources for:

- Application hosting.
- Data processing.
- Model inference.
- Model training.
- Background processing.
- Integration services.

Virtual machines remain an important building block of cloud architecture.

## What Is a Virtual Machine?

A virtual machine is a software-based computer that runs on physical hardware through a virtualization layer.

A virtual machine typically includes:

- Virtual CPU.
- Memory.
- Virtual storage.
- Network interfaces.
- Operating system.

Multiple virtual machines can operate on the same physical host.

## Cloud Virtual Machine Services

Examples include:

- Amazon EC2.
- Azure Virtual Machines.
- Google Compute Engine.

Cloud providers offer different machine families.

### General Purpose

Designed for balanced CPU and memory workloads.

Common uses:

- Web applications.
- Application servers.
- Development environments.

### Compute Optimized

Designed for workloads requiring significant processing capacity.

Common uses:

- Data processing.
- High-performance application workloads.
- CPU-intensive services.

### Memory Optimized

Designed for workloads requiring large amounts of memory.

Common uses:

- In-memory databases.
- Large data processing tasks.
- Memory-intensive applications.

### Accelerated Computing

Uses specialized hardware such as GPUs.

Common uses:

- AI model training.
- Deep learning.
- GPU-accelerated inference.

## Selecting Compute Resources

An architect should consider:

- CPU requirements.
- Memory requirements.
- Storage performance.
- Network throughput.
- GPU requirements.
- Workload duration.
- Availability.
- Cost.

## Scaling Compute

### Vertical Scaling

Increase the capacity of an existing machine.

Examples:

- More CPU.
- More memory.
- Larger instance type.

### Horizontal Scaling

Add additional compute instances.

A load balancer can distribute requests across multiple instances.

## Enterprise AI Example

An organization hosts an AI application using cloud virtual machines.

The architecture may include:

1. Application virtual machines.
2. AI orchestration services.
3. A managed database.
4. Object storage.
5. Network load balancing.
6. Monitoring infrastructure.

The architect must ensure that compute capacity matches expected demand.

## Key Takeaway

Virtual machines provide flexible compute resources for enterprise workloads. Selecting the correct compute family and scaling strategy is essential for reliable and cost-effective AI systems.`,
          },
          {
            type: 'check',
            question: "Which compute instance family is generally most appropriate for deep learning workloads that require GPU acceleration?",
            options: [
              "Accelerated computing instances.",
              "General-purpose instances.",
              "Storage-optimized instances.",
              "Memory-optimized instances.",
            ],
            answer: 0,
            explanation: "Accelerated computing instances provide specialized hardware such as GPUs that can support deep learning training and inference workloads.",
          },
        ],
      },
      {
        id: "containers-and-kubernetes-fundamentals",
        title: "Containers and Kubernetes Fundamentals",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Containers and Kubernetes Fundamentals

## Introduction

Containers package applications and their dependencies into portable units.

They are widely used for modern cloud application deployment.

AI systems can use containers to deploy:

- Model inference services.
- API applications.
- Data processing workers.
- AI orchestration services.
- Background tasks.

## What Is a Container?

A container packages application code with the dependencies needed to execute it.

Containers share the host operating system kernel while maintaining isolated execution environments.

This generally makes them lighter than traditional virtual machines.

## Container Components

A containerized application commonly uses:

### Container Image

A packaged template containing the application and its dependencies.

### Container Runtime

Software responsible for running containers.

### Container Registry

A repository used to store and distribute container images.

### Container Instance

A running execution of a container image.

## Docker

Docker is a widely used platform for building and running containers.

A typical workflow includes:

1. Write application code.
2. Create a Dockerfile.
3. Build an image.
4. Test the image.
5. Push the image to a registry.
6. Deploy the image.

## What Is Kubernetes?

Kubernetes is a container orchestration platform.

It helps manage containerized applications across clusters of machines.

Kubernetes provides capabilities such as:

- Deployment management.
- Service discovery.
- Load balancing.
- Scaling.
- Scheduling.
- Health checks.
- Self-healing.

## Important Kubernetes Concepts

### Cluster

A group of machines managed by Kubernetes.

### Node

A machine that participates in the cluster.

### Pod

The smallest deployable unit in Kubernetes.

A pod can contain one or more containers.

### Deployment

Defines the desired state of application pods.

### Service

Provides a stable network endpoint for accessing pods.

### ConfigMap and Secret

Provide configuration values and sensitive information to workloads.

Secrets still require appropriate access controls and encryption configuration.

## Kubernetes for AI

An AI platform might use Kubernetes to run:

- Model-serving containers.
- API services.
- Retrieval services.
- Agent orchestration workers.
- Background data-processing jobs.

GPU-enabled nodes may be used for supported workloads.

## Key Takeaway

Containers provide portable application packaging, while Kubernetes coordinates container deployment, scaling, and lifecycle management across clusters.`,
          },
          {
            type: 'check',
            question: "What is the smallest deployable unit in Kubernetes?",
            options: [
              "Pod.",
              "Cluster.",
              "Deployment.",
              "Node.",
            ],
            answer: 0,
            explanation: "A pod is the smallest deployable unit in Kubernetes and contains one or more containers.",
          },
        ],
      },
      {
        id: "serverless-and-event-driven-compute",
        title: "Serverless and Event-Driven Compute",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Serverless and Event-Driven Compute

## Introduction

Serverless computing allows developers to run application logic without directly managing the underlying servers.

The cloud provider manages much of the infrastructure provisioning and scaling.

Serverless is especially useful for event-driven application components.

## What Is Serverless Computing?

Serverless computing abstracts infrastructure management.

Developers focus on:

- Application code.
- Events.
- Business logic.
- Service configuration.

The provider manages the underlying execution infrastructure.

Serverless does not mean that servers do not exist.

## Function as a Service

Function as a Service (FaaS) allows developers to execute small units of code in response to events.

Examples include:

- AWS Lambda.
- Azure Functions.
- Google Cloud Run functions.

Common use cases:

- Processing uploaded documents.
- Responding to database changes.
- Handling API requests.
- Sending notifications.
- Triggering AI workflows.

## Event-Driven Architecture

An event-driven architecture reacts to events produced by applications or services.

Example:

1. A user uploads a document.
2. Object storage generates an event.
3. A serverless function receives the event.
4. The function extracts document content.
5. The content is processed.
6. An embedding service generates vectors.
7. The vectors are stored in a retrieval system.

## Serverless Advantages

- Reduced infrastructure management.
- Automatic scaling in supported services.
- Event-based execution.
- Consumption-based pricing.
- Rapid development.

## Serverless Limitations

Architects must consider:

- Execution time limits.
- Cold starts.
- Runtime constraints.
- Memory limits.
- Concurrency limits.
- Observability.
- Vendor-specific behavior.

Some AI workloads require persistent processes, specialized hardware, or long-running execution environments.

These may be better suited to containers or dedicated compute infrastructure.

## Serverless and AI Architecture

Serverless functions can coordinate AI operations without hosting the entire AI platform in one continuously running service.

For example:

- Receive a user request.
- Validate input.
- Retrieve application metadata.
- Invoke a model endpoint.
- Store results.
- Notify the user.

Long-running model workloads may execute in a separate managed service.

## Choosing Between Compute Models

Use virtual machines when greater operating system and infrastructure control is required.

Use containers when application portability and orchestration are important.

Use serverless when event-driven execution and reduced infrastructure management are beneficial.

## Key Takeaway

Serverless computing simplifies infrastructure management for suitable workloads. Enterprise architects should select it based on execution requirements, scalability, operational needs, and cost.`,
          },
          {
            type: 'check',
            question: "Which workload is particularly suitable for serverless event-driven execution?",
            options: [
              "A database server that must run around the clock.",
              "A long training job that runs for several days.",
              "Processing a document right after it is uploaded.",
              "A latency-critical service with constant traffic.",
            ],
            answer: 2,
            explanation: "Document processing triggered by an upload event is a suitable event-driven serverless workload.",
          },
        ],
      },
    ],
  },
  {
    id: "cloud-networking-ai-systems",
    title: "Cloud Networking for AI Systems",
    lessons: [
      {
        id: "virtual-networks-subnets-and-routing",
        title: "Virtual Networks, Subnets, and Routing",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Virtual Networks, Subnets, and Routing

## Introduction

Cloud networking connects application components, users, databases, and external services.

A secure enterprise AI architecture requires deliberate network segmentation and traffic control.

## Virtual Private Cloud

A Virtual Private Cloud (VPC) provides an isolated logical network within a public cloud environment.

Cloud providers use different terminology.

Examples:

- AWS Virtual Private Cloud.
- Azure Virtual Network.
- Google Cloud VPC Network.

A virtual network provides a foundation for organizing cloud resources.

## IP Addressing

Cloud resources communicate using IP addresses.

Private IP address ranges commonly include:

- 10.0.0.0/8
- 172.16.0.0/12
- 192.168.0.0/16

An architect must plan address spaces carefully to avoid conflicts with existing enterprise networks.

## Subnets

A subnet divides a network into smaller address ranges.

Subnets can be used to separate workloads according to their roles.

Example architecture:

### Public Subnet

May contain:

- Internet-facing load balancers.
- Approved public entry points.

### Private Application Subnet

May contain:

- Application servers.
- AI orchestration services.
- Internal APIs.

### Private Data Subnet

May contain:

- Databases.
- Internal data services.
- Restricted storage endpoints.

The exact design depends on the cloud provider and application requirements.

## Routing

Route tables determine where network traffic should be sent.

Possible destinations include:

- Local network ranges.
- Internet gateways.
- NAT gateways.
- VPN connections.
- Private connectivity services.

## Network Segmentation

Segmentation limits communication between components.

For example:

- Public traffic reaches an approved gateway.
- The gateway communicates with application services.
- Application services access approved data services.
- Databases do not accept unrestricted public connections.

## Enterprise AI Example

An AI application may use:

1. A public entry point.
2. A private application network.
3. A private model-serving network.
4. Restricted data storage.
5. Private connectivity to enterprise systems.

## Key Takeaway

Virtual networks, subnets, and routing provide the foundation for secure and organized cloud infrastructure.`,
          },
          {
            type: 'check',
            question: "What is the primary purpose of using separate subnets for application and database workloads?",
            options: [
              "To organize the network and support segmentation.",
              "To give each workload its own public IP address.",
              "To let the database reach the internet directly.",
              "To spread traffic evenly across availability zones.",
            ],
            answer: 0,
            explanation: "Subnet segmentation separates workloads and supports more controlled network communication and security policies.",
          },
        ],
      },
      {
        id: "cloud-firewalls-security-groups-and-network-controls",
        title: "Cloud Firewalls, Security Groups, and Network Controls",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Cloud Firewalls, Security Groups, and Network Controls

## Introduction

Cloud network security controls determine which systems can communicate.

They help protect applications, databases, model endpoints, and internal services.

## Network Security Groups and Security Groups

Cloud providers offer controls that filter network traffic.

Examples include:

- AWS Security Groups.
- Azure Network Security Groups.
- Google Cloud firewall rules.

These controls commonly evaluate:

- Source IP address.
- Destination IP address.
- Protocol.
- Port.
- Direction of traffic.

## Inbound Rules

Inbound rules control traffic entering a protected resource.

Example:

An application server may accept HTTPS traffic only from an approved load balancer.

## Outbound Rules

Outbound rules control traffic leaving a protected resource.

Example:

An AI orchestration service may be allowed to connect only to approved model endpoints and enterprise APIs.

## Firewalls

Firewalls enforce traffic policies between network zones or resources.

They can provide:

- Traffic filtering.
- Network segmentation.
- Logging.
- Threat detection integrations.
- Policy enforcement.

## Common Network Ports

Some commonly encountered ports include:

- 22: SSH.
- 53: DNS.
- 80: HTTP.
- 443: HTTPS.
- 3389: Remote Desktop Protocol.

Only expose ports that are required for approved business operations.

## Network Security for AI

AI systems may communicate with:

- Model endpoints.
- Vector databases.
- Document repositories.
- API gateways.
- Enterprise applications.
- External model providers.

Each connection should have an explicit business purpose and security policy.

## Zero Trust Networking

Zero Trust is an approach in which network location alone does not establish trust.

Access decisions should consider:

- Identity.
- Device or workload context.
- Authorization.
- Resource sensitivity.
- Policy requirements.

## Logging and Monitoring

Monitor:

- Allowed connections.
- Denied connections.
- Unusual traffic patterns.
- Unexpected outbound communication.
- Administrative network changes.

## Key Takeaway

Cloud network controls establish boundaries between workloads and reduce unnecessary communication. Secure AI architectures should permit only approved network paths.`,
          },
          {
            type: 'check',
            question: "Which network security principle requires explicitly permitting only necessary communication between workloads?",
            options: [
              "Defense in depth.",
              "Least privilege network access.",
              "Network address translation.",
              "Zero-trust identity federation.",
            ],
            answer: 1,
            explanation: "Least privilege network access limits communication to the ports, protocols, sources, and destinations required by the workload.",
          },
        ],
      },
      {
        id: "dns-load-balancing-and-private-connectivity",
        title: "DNS, Load Balancing, and Private Connectivity",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# DNS, Load Balancing, and Private Connectivity

## Introduction

Enterprise AI applications require reliable communication between users, applications, APIs, and cloud services.

DNS, load balancing, and private connectivity are essential networking capabilities.

## Domain Name System

DNS translates domain names into network addresses.

For example:

An application may use:

ai.company.com

DNS resolves the name to an appropriate endpoint.

Cloud architects should understand:

- Public DNS.
- Private DNS.
- DNS records.
- Name resolution.
- DNS forwarding.
- Hybrid DNS integration.

## Common DNS Records

### A Record

Maps a hostname to an IPv4 address.

### AAAA Record

Maps a hostname to an IPv6 address.

### CNAME Record

Creates an alias for another hostname.

### MX Record

Identifies mail exchange servers.

### TXT Record

Stores text-based information, commonly used for verification and policy records.

## Load Balancing

A load balancer distributes incoming traffic across multiple backend resources.

Benefits include:

- Improved availability.
- Traffic distribution.
- Horizontal scaling.
- Health-based routing.
- Reduced dependency on one server.

## Layer 4 and Layer 7 Load Balancing

### Layer 4

Operates primarily at the transport layer.

It commonly routes traffic using IP addresses and ports.

### Layer 7

Operates at the application layer.

It can route based on information such as:

- Hostnames.
- URL paths.
- HTTP headers.
- Application-level rules.

## Private Connectivity

Enterprise systems may need to communicate with cloud resources without exposing services directly to the public internet.

Common options include:

### Site-to-Site VPN

Creates an encrypted connection between networks over the internet.

### Dedicated Private Connectivity

Provides a dedicated or provider-managed connection between an enterprise network and cloud infrastructure.

Examples:

- AWS Direct Connect.
- Azure ExpressRoute.
- Google Cloud Interconnect.

### Private Endpoints

Allow approved access to supported cloud services through private network connectivity.

## Enterprise AI Example

A company hosts an AI application in the cloud but needs to access internal enterprise knowledge systems.

The architecture may include:

1. Private connectivity to the enterprise network.
2. Private DNS resolution.
3. Controlled routing.
4. Firewall policies.
5. Private application endpoints.
6. Monitoring and logging.

## Key Takeaway

DNS provides service discovery, load balancing distributes traffic, and private connectivity enables controlled communication between enterprise and cloud environments.`,
          },
          {
            type: 'check',
            question: "Which service provides a dedicated private network connection between an enterprise data center and a cloud provider?",
            options: [
              "A site-to-site VPN that runs encrypted tunnels over the internet.",
              "A global load balancer that routes users to the nearest region.",
              "A content delivery network that caches content near the data center.",
              "Dedicated connectivity such as AWS Direct Connect or ExpressRoute.",
            ],
            answer: 3,
            explanation: "Dedicated private connectivity services provide private network connections between enterprise environments and cloud infrastructure.",
          },
        ],
      },
    ],
  },
  {
    id: "cloud-storage-data-architecture",
    title: "Cloud Storage and Data Architecture",
    lessons: [
      {
        id: "cloud-object-block-and-file-storage",
        title: "Object, Block, and File Storage",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# Object, Block, and File Storage

Understanding Cloud Storage

Cloud platforms provide different storage services designed for different workloads.

Object storage stores data as objects with metadata and unique identifiers. It is commonly used for documents, images, backups, logs, datasets, and AI training data.

Block storage provides virtual disk volumes that operating systems and applications can use like physical disks. It is useful for databases, virtual machines, and applications requiring low-latency disk access.

File storage provides shared file systems organized into directories and files. It is useful when multiple servers or applications need access to shared file data.

For AI solutions, object storage is commonly used for training datasets, model artifacts, and archived inference data. Block storage can support high-performance application workloads, while file storage can support shared processing environments.

Architects must evaluate performance, latency, durability, access patterns, scalability, and cost before selecting a storage service.`,
          },
          {
            type: 'check',
            question: "Which cloud storage type is generally best suited for storing large collections of AI training images and documents?",
            options: [
              "File storage",
              "Object storage",
              "Block storage",
              "Archive storage",
            ],
            answer: 1,
            explanation: "Object storage is designed for scalable storage of unstructured data such as images, documents, datasets, and model artifacts.",
          },
        ],
      },
      {
        id: "cloud-data-lakes-and-data-warehouses",
        title: "Data Lakes and Data Warehouses",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# Data Lakes and Data Warehouses

Designing Cloud Data Platforms

Data lakes and data warehouses serve different purposes in enterprise data architecture.

A data lake stores large volumes of structured, semi-structured, and unstructured data. Data may be stored in its original format and processed when needed.

A data warehouse organizes structured and curated data for reporting, analytics, and business intelligence.

A lakehouse combines characteristics of data lakes and data warehouses. It supports flexible data storage while providing capabilities such as structured metadata, governance, and analytical querying.

AI systems frequently consume data from lakes, warehouses, and lakehouse platforms.

A typical enterprise architecture may collect information from operational databases, APIs, files, and streaming systems. The data is then validated, transformed, governed, and made available to analytical and AI workloads.

Architects must consider data quality, lineage, metadata, access controls, retention policies, and data ownership.`,
          },
          {
            type: 'check',
            question: "Which architecture is designed to store large volumes of structured, semi-structured, and unstructured data in their original formats?",
            options: [
              "Data warehouse",
              "Data lake",
              "Data mart",
              "Operational database",
            ],
            answer: 1,
            explanation: "A data lake can store different data formats and support multiple downstream analytical and AI processing workloads.",
          },
        ],
      },
      {
        id: "cloud-data-processing-and-pipelines",
        title: "Cloud Data Processing and Pipelines",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# Cloud Data Processing and Pipelines

Building Data Pipelines for AI

Data pipelines move information from source systems into environments where it can be processed, analyzed, and consumed by applications.

ETL stands for Extract, Transform, Load. Data is extracted from source systems, transformed into the required format, and loaded into a destination.

ELT stands for Extract, Load, Transform. Data is first loaded into a destination and then transformed using the destination platform's processing capabilities.

Batch processing handles data in groups at scheduled intervals. It is useful for historical reporting, scheduled model training, and periodic data synchronization.

Stream processing handles events continuously or with very low latency. It is useful for real-time analytics, event detection, and applications that require continuously updated information.

AI data pipelines may include data ingestion, validation, cleansing, normalization, feature engineering, dataset versioning, and delivery to model training environments.

A reliable pipeline should include monitoring, retries, error handling, data quality checks, and security controls.`,
          },
          {
            type: 'check',
            question: "Which processing approach is most appropriate when an AI application must react to incoming events continuously?",
            options: [
              "Stream processing",
              "Micro-batch ETL",
              "Nightly batch jobs",
              "Scheduled exports",
            ],
            answer: 0,
            explanation: "Stream processing continuously processes incoming events and is appropriate for low-latency applications and real-time analytics.",
          },
        ],
      },
    ],
  },
  {
    id: "ai-infrastructure-accelerators",
    title: "AI Infrastructure and Accelerators",
    lessons: [
      {
        id: "cpu-gpu-and-ai-accelerators",
        title: "CPUs, GPUs, and AI Accelerators",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# CPUs, GPUs, and AI Accelerators

Choosing Compute Hardware for AI

AI workloads require different types of compute resources depending on the complexity and scale of the task.

Central Processing Units (CPUs) are general-purpose processors designed to handle a wide variety of workloads. They are commonly used for application logic, orchestration, data preparation, and general-purpose computation.

Graphics Processing Units (GPUs) contain many processing cores and are designed to execute large numbers of operations in parallel. This makes them valuable for deep learning training and inference.

Specialized AI accelerators are hardware platforms designed to optimize machine learning operations. Examples include Google's Tensor Processing Units (TPUs) and other purpose-built inference accelerators.

Training workloads often require significant compute capacity, memory bandwidth, and high-performance interconnects.

Inference workloads execute trained models to generate predictions or responses. Their infrastructure requirements depend on model size, throughput, latency, and concurrency.

Architects should select accelerators based on workload requirements rather than assuming every AI application needs expensive GPU infrastructure.`,
          },
          {
            type: 'check',
            question: "Why are GPUs commonly used for deep learning workloads?",
            options: [
              "They run huge numbers of operations in parallel",
              "They have faster single-threaded clock speeds than CPUs",
              "They store whole datasets in their onboard memory",
              "They are cheaper per hour than equivalent CPU servers",
            ],
            answer: 0,
            explanation: "GPUs provide parallel processing capabilities that make them effective for many computationally intensive machine learning workloads.",
          },
        ],
      },
      {
        id: "ai-training-and-inference-infrastructure",
        title: "AI Training and Inference Infrastructure",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# AI Training and Inference Infrastructure

Designing Training and Inference Environments

AI training and inference are different workload stages and often require different infrastructure designs.

Training uses datasets to teach a model how to identify patterns and produce predictions. Training can require substantial compute resources, memory, storage bandwidth, and distributed processing.

Inference uses a trained model to generate predictions, classifications, recommendations, or responses.

Training environments may prioritize accelerator availability, distributed computing, dataset throughput, and experiment reproducibility.

Inference environments commonly prioritize response latency, throughput, availability, scalability, and operational cost.

For example, an enterprise may train a language model in a dedicated GPU environment but deploy the resulting model behind an API that scales according to user demand.

Inference architectures may use autoscaling, request batching, model caching, traffic routing, and accelerator sharing to improve efficiency.

Architects must evaluate whether training and inference should operate in separate environments or share selected infrastructure components.`,
          },
          {
            type: 'check',
            question: "Which requirement is generally most important when designing a real-time AI inference service?",
            options: [
              "High training throughput",
              "Low response latency",
              "Long-term archival storage",
              "Large dataset capacity",
            ],
            answer: 1,
            explanation: "Real-time inference services must respond quickly. Latency, throughput, availability, and scaling are important design considerations.",
          },
        ],
      },
      {
        id: "distributed-ai-computing",
        title: "Distributed AI Computing",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# Distributed AI Computing

Scaling AI Across Multiple Compute Resources

Large AI workloads may exceed the capacity of a single compute instance.

Distributed computing allows workloads to execute across multiple machines or accelerators.

Data parallelism distributes different portions of a training dataset across multiple workers. Each worker processes data and contributes to model updates.

Model parallelism divides a model across multiple devices when the model cannot efficiently fit into the memory of a single device.

Distributed training introduces architectural requirements such as high-speed networking, synchronization, shared storage, workload orchestration, and failure recovery.

GPU clusters can require high-bandwidth, low-latency interconnects to support communication between accelerators.

Architects must also consider scheduling, resource utilization, job isolation, capacity planning, and the cost of maintaining distributed infrastructure.

Distributed AI computing improves scalability but introduces operational complexity. It should be used when workload requirements justify the additional infrastructure.`,
          },
          {
            type: 'check',
            question: "What is the primary purpose of data parallelism in distributed AI training?",
            options: [
              "To split one large model's layers across several GPUs",
              "To spread portions of the training data across workers",
              "To train several different models at the same time",
              "To keep copies of the model in different regions",
            ],
            answer: 1,
            explanation: "Data parallelism distributes training data across multiple workers so they can process different batches and contribute to model training.",
          },
        ],
      },
    ],
  },
  {
    id: "managed-ai-cloud-services",
    title: "Managed AI and Cloud Services",
    lessons: [
      {
        id: "managed-machine-learning-platforms",
        title: "Managed Machine Learning Platforms",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# Managed Machine Learning Platforms

Using Managed Machine Learning Services

Cloud providers offer managed machine learning platforms that reduce the operational burden of building and maintaining AI infrastructure.

These platforms may provide notebook environments, training jobs, model registries, deployment endpoints, experiment tracking, and pipeline orchestration.

Examples include Amazon SageMaker, Microsoft Azure Machine Learning, and Google Vertex AI.

Managed platforms allow teams to focus more on model development and less on manually provisioning and maintaining infrastructure.

However, managed services do not eliminate architectural responsibilities. Organizations must still evaluate identity management, networking, encryption, data governance, availability, service limits, and cost.

A managed platform may also introduce vendor-specific dependencies. Architects should consider portability, integration requirements, supported frameworks, and exit strategies.

The appropriate service depends on the organization's existing cloud environment, technical capabilities, compliance requirements, and operational model.`,
          },
          {
            type: 'check',
            question: "What is a major architectural advantage of managed machine learning platforms?",
            options: [
              "Less infrastructure to manage",
              "Guaranteed model accuracy",
              "No need for data governance",
              "No security responsibilities",
            ],
            answer: 0,
            explanation: "Managed ML platforms provide infrastructure and operational capabilities that reduce the amount of platform management performed by engineering teams.",
          },
        ],
      },
      {
        id: "managed-foundation-model-and-llm-services",
        title: "Foundation Model and LLM Cloud Services",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# Foundation Model and LLM Cloud Services

Consuming Foundation Models Through Cloud Services

Foundation models are large models trained on broad datasets and capable of supporting multiple downstream tasks.

Large language models (LLMs) can support conversational applications, summarization, classification, information extraction, code assistance, and other language-based workflows.

Cloud providers offer managed services that allow organizations to access foundation models through APIs rather than hosting every model themselves.

Examples include Amazon Bedrock, Azure AI Foundry model services, and Google Vertex AI.

A typical architecture includes an application, an authentication layer, an API endpoint, a model service, and supporting data services.

Enterprise architectures may also include retrieval-augmented generation (RAG), content filtering, prompt management, usage monitoring, and human approval workflows.

Architects must evaluate model availability, regional support, data handling, throughput limits, latency, pricing, model versioning, and provider dependencies.

Using a managed foundation model service reduces the need to operate model infrastructure but does not remove the need for application security and responsible AI controls.`,
          },
          {
            type: 'check',
            question: "What is a primary benefit of consuming a managed foundation model through a cloud API?",
            options: [
              "It removes the need to monitor the application",
              "It removes the need for application security",
              "Using a model without running its infrastructure",
              "The model can read enterprise databases by itself",
            ],
            answer: 2,
            explanation: "Managed model APIs allow applications to consume foundation models without the organization having to operate all the underlying model infrastructure.",
          },
        ],
      },
      {
        id: "cloud-ai-integration-and-service-architecture",
        title: "Integrating AI Services Into Enterprise Applications",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# Integrating AI Services Into Enterprise Applications

Enterprise AI Service Integration

Enterprise applications typically consume AI capabilities through APIs, SDKs, or managed cloud integrations.

An application should not expose cloud AI credentials directly to an untrusted client. Requests should pass through an appropriately secured backend or API layer.

A common architecture includes a user-facing application, API gateway, authentication service, application backend, AI orchestration layer, and managed model endpoint.

The orchestration layer can coordinate model calls, retrieve enterprise information, validate inputs and outputs, and enforce business rules.

Enterprise integration may also require connections to databases, document repositories, workflow platforms, identity providers, and existing business applications.

Architects should define service contracts, authentication requirements, request and response formats, timeout behavior, retry policies, rate limits, and error handling.

Observability is essential. AI integrations should capture appropriate operational metrics, failures, latency, usage, and cost while protecting sensitive information.

The goal is to integrate AI as a governed enterprise capability rather than introducing isolated model endpoints without operational controls.`,
          },
          {
            type: 'check',
            question: "Why should enterprise AI applications use a secured backend or API layer instead of exposing cloud AI credentials directly to browser clients?",
            options: [
              "To let the browser cache model responses between sessions",
              "To cut latency by skipping the network hop to the backend",
              "To centralize credentials, authentication and controls",
              "To let each user call the model with their own API key",
            ],
            answer: 2,
            explanation: "A secured backend protects credentials and provides a controlled location for authentication, authorization, validation, rate limiting, and monitoring.",
          },
        ],
      },
    ],
  },
  {
    id: "containerization-ai-deployment",
    title: "Containerization and AI Deployment",
    lessons: [
      {
        id: "docker-containers-and-ai-workloads",
        title: "Docker Containers and AI Workloads",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# Docker Containers and AI Workloads

Packaging AI Applications with Containers

Containerization packages an application and its dependencies into a portable unit called a container.

Docker is a widely used platform for building, distributing, and running containers.

A container image includes the application code, runtime, libraries, and configuration needed to execute a workload.

Containers help ensure that AI applications behave consistently across development, testing, and production environments.

An AI inference container may include an application server, model-serving framework, dependencies, and model-loading logic.

Container images should be versioned, scanned for vulnerabilities, and stored in controlled container registries.

Architects must consider image size, startup time, resource consumption, security, and reproducibility.

Containers provide application portability, but they do not automatically guarantee security or scalability. Those capabilities require appropriate infrastructure and operational controls.`,
          },
          {
            type: 'check',
            question: "What is the primary purpose of containerizing an AI application?",
            options: [
              "To run the application without an operating system",
              "To speed up model inference on GPUs automatically",
              "To replace the need for Kubernetes or orchestration",
              "To package the app and dependencies as one portable unit",
            ],
            answer: 3,
            explanation: "Containers package applications and their dependencies to provide consistent execution across different environments.",
          },
        ],
      },
      {
        id: "kubernetes-and-container-orchestration",
        title: "Kubernetes and Container Orchestration",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# Kubernetes and Container Orchestration

Orchestrating Containerized AI Services

Kubernetes is a container orchestration platform used to deploy, manage, and scale containerized applications.

A Kubernetes cluster consists of a control plane and worker nodes.

The control plane manages the cluster and coordinates scheduling and desired application state.

Worker nodes execute application workloads inside containers.

Kubernetes uses objects such as Pods, Deployments, Services, ConfigMaps, and Secrets to manage application workloads.

For AI systems, Kubernetes can host model-serving APIs, data-processing services, orchestration components, and GPU-enabled workloads.

Horizontal Pod Autoscaling can adjust the number of application replicas based on defined metrics.

GPU resources can be exposed to workloads through supported device plugins and node configurations.

Architects must consider cluster security, workload isolation, resource requests and limits, networking, persistent storage, monitoring, and upgrades.

Kubernetes provides powerful orchestration capabilities, but it also introduces operational complexity that must be managed.`,
          },
          {
            type: 'check',
            question: "Which Kubernetes component is primarily responsible for running containerized workloads?",
            options: [
              "Control plane",
              "API server",
              "Ingress controller",
              "Worker node",
            ],
            answer: 3,
            explanation: "Worker nodes provide the compute environment where Kubernetes schedules and runs application Pods.",
          },
        ],
      },
      {
        id: "model-serving-and-deployment-patterns",
        title: "Model Serving and Deployment Patterns",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# Model Serving and Deployment Patterns

Deploying AI Models into Production

Model serving makes trained machine learning models available to applications through controlled interfaces.

A model-serving architecture may expose REST APIs, gRPC endpoints, or other application interfaces.

Synchronous inference returns a prediction or response directly to the requesting application.

Asynchronous inference accepts a request for processing and returns a tracking identifier or another acknowledgment while the workload executes separately.

Batch inference processes many records together and is useful for scheduled or large-scale prediction workloads.

Blue-green deployment maintains two environments. Traffic can be shifted from the existing environment to the new environment after validation.

Canary deployment gradually routes a portion of traffic to a new model or application version before increasing exposure.

Model versioning allows teams to track which model is deployed and supports controlled rollback.

Architects should consider latency, throughput, scaling, observability, deployment risk, and model compatibility when selecting a serving pattern.`,
          },
          {
            type: 'check',
            question: "Which deployment strategy gradually routes a small percentage of production traffic to a new model version before expanding its use?",
            options: [
              "Blue-green deployment",
              "Rolling update",
              "Canary deployment",
              "Shadow deployment",
            ],
            answer: 2,
            explanation: "Canary deployment introduces a new version to a limited portion of production traffic before expanding deployment.",
          },
        ],
      },
    ],
  },
  {
    id: "cloud-security-identity-architecture",
    title: "Cloud Security and Identity Architecture",
    lessons: [
      {
        id: "cloud-iam-and-least-privilege",
        title: "Identity and Access Management",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# Identity and Access Management

Designing Cloud Identity and Access Controls

Identity and Access Management (IAM) controls who can access cloud resources and what actions they can perform.

Authentication verifies the identity of a user, service, or workload.

Authorization determines which resources and operations an authenticated identity is permitted to access.

Role-Based Access Control (RBAC) assigns permissions through roles.

Attribute-Based Access Control (ABAC) evaluates attributes such as identity, resource classification, environment, and request context.

The principle of least privilege means granting only the permissions required to perform an assigned task.

Workload identities allow applications and services to authenticate without relying on long-lived credentials embedded in application code.

Enterprise AI architectures should use separate identities for users, applications, model-serving workloads, data pipelines, and administrative operations.

Access should be reviewed regularly, privileged actions should be monitored, and credentials should be protected through appropriate secret-management mechanisms.`,
          },
          {
            type: 'check',
            question: "What does the principle of least privilege require?",
            options: [
              "Each team receives administrator access within its own project",
              "Applications share one service account to simplify auditing",
              "Identities get only the permissions their role requires",
              "Permissions are granted broadly and reviewed once a year",
            ],
            answer: 2,
            explanation: "Least privilege limits permissions to what is necessary, reducing the potential impact of compromised identities or accidental actions.",
          },
        ],
      },
      {
        id: "cloud-network-and-data-security",
        title: "Cloud Network and Data Security",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# Cloud Network and Data Security

Protecting Enterprise AI Infrastructure

Cloud security requires multiple layers of protection across networks, applications, identities, and data.

Network segmentation separates workloads into controlled network zones.

Private endpoints and private connectivity can reduce exposure of sensitive services to public networks.

Firewalls, security groups, and network access control mechanisms enforce permitted communication paths.

Encryption in transit protects information as it moves between systems.

Encryption at rest protects stored information, including databases, object storage, backups, and model artifacts.

Key management services help organizations create, protect, rotate, and control cryptographic keys.

AI environments may process sensitive documents, personal information, business records, and proprietary model data.

Architects should define data classification, access policies, encryption requirements, retention controls, and secure deletion processes.

Security controls should be designed into the architecture rather than added only after deployment.`,
          },
          {
            type: 'check',
            question: "Which security mechanism protects sensitive data while it travels between an application and a cloud service?",
            options: [
              "Encryption in transit",
              "Encryption at rest",
              "Object versioning",
              "Network ACLs",
            ],
            answer: 0,
            explanation: "Encryption in transit protects information as it moves across networks between clients, applications, and services.",
          },
        ],
      },
      {
        id: "ai-security-governance-and-compliance",
        title: "AI Security, Governance, and Compliance",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# AI Security, Governance, and Compliance

Governance Requirements for Enterprise AI

Enterprise AI systems introduce governance requirements beyond traditional infrastructure security.

Organizations should identify which data sources models can access and establish controls over how that information is used.

Sensitive information may require masking, redaction, tokenization, or other protective measures before it is submitted to an AI service.

Prompt injection is an attack in which malicious instructions attempt to manipulate an AI system through its input or retrieved content.

Output validation and content filtering can reduce the risk of unsafe or inappropriate responses.

Retrieval-augmented generation systems should enforce authorization at the data retrieval layer. A model should not retrieve documents that the requesting user is not permitted to access.

AI governance should include model inventory, ownership, approved use cases, risk assessment, auditability, monitoring, and change management.

Compliance requirements depend on the organization, industry, geography, and data being processed.

Architects should work with security, legal, privacy, risk, and compliance stakeholders to define appropriate controls.`,
          },
          {
            type: 'check',
            question: "In an enterprise RAG architecture, where should document authorization be enforced?",
            options: [
              "After the model generates its response",
              "In the prompt, by telling the model the user's role",
              "At the retrieval and access-control layer",
              "In the user interface, by hiding restricted results",
            ],
            answer: 2,
            explanation: "Authorization must be enforced when retrieving documents so users cannot access information they are not permitted to see.",
          },
        ],
      },
    ],
  },
  {
    id: "cloud-high-availability-disaster-recovery",
    title: "High Availability and Disaster Recovery",
    lessons: [
      {
        id: "cloud-high-availability-fundamentals",
        title: "High Availability Architecture",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# High Availability Architecture

Designing Highly Available Cloud Systems

High availability is the ability of a system to remain accessible and operational despite failures.

Cloud architectures improve availability through redundancy, fault isolation, automated recovery, and health monitoring.

Availability Zones are isolated infrastructure locations within a cloud region. Deploying workloads across multiple zones can reduce the impact of a localized failure.

Load balancers distribute incoming requests across healthy application instances.

Health checks help identify unhealthy instances so traffic can be routed to available resources.

Auto scaling adjusts infrastructure capacity based on demand and configured policies.

For AI applications, highly available architectures may distribute API services, orchestration components, and model-serving workloads across multiple failure domains.

Architects must identify critical dependencies, eliminate unnecessary single points of failure, and test recovery mechanisms.

High availability is not achieved simply by running multiple servers. The entire service architecture, including networking, storage, identity, and external dependencies, must be considered.`,
          },
          {
            type: 'check',
            question: "Why deploy application workloads across multiple Availability Zones?",
            options: [
              "To reduce compute costs by using spare capacity in each zone",
              "To meet data residency rules for each country served",
              "To avoid depending on a single infrastructure failure domain",
              "To lower latency for users in other geographic regions",
            ],
            answer: 2,
            explanation: "Multiple Availability Zones provide infrastructure redundancy and help protect workloads against localized failures.",
          },
        ],
      },
      {
        id: "disaster-recovery-rto-and-rpo",
        title: "Disaster Recovery, RTO, and RPO",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# Disaster Recovery, RTO, and RPO

Planning for Infrastructure Disruptions

Disaster recovery defines how an organization restores technology services after a major disruption.

Recovery Time Objective (RTO) is the maximum targeted time to restore a service after an outage.

Recovery Point Objective (RPO) defines the maximum acceptable amount of data loss measured in time.

For example, an RPO of 15 minutes means the organization aims to recover data with no more than 15 minutes of data loss.

A low RTO requires services to recover quickly. A low RPO requires frequent replication or backups to reduce potential data loss.

Common disaster recovery strategies include backup and restore, pilot light, warm standby, and multi-site active-active architectures.

Backup and restore is generally less expensive but may require longer recovery times.

Warm standby maintains a scaled-down operational environment that can be expanded during a disaster.

Active-active architectures operate across multiple locations and can provide rapid failover, but they introduce additional cost and complexity.

Architects should select recovery strategies based on business impact, service criticality, data requirements, and budget.`,
          },
          {
            type: 'check',
            question: "What does an RPO of 15 minutes represent?",
            options: [
              "The system must recover within 15 minutes of an outage",
              "Up to 15 minutes of data loss is acceptable",
              "Backups must finish within 15 minutes of starting",
              "Failover must be tested every 15 minutes",
            ],
            answer: 1,
            explanation: "RPO defines the acceptable data loss measured in time. A 15-minute RPO means recovery should preserve data to within approximately 15 minutes of the disruption.",
          },
        ],
      },
      {
        id: "backup-replication-and-failover",
        title: "Backup, Replication, and Failover",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# Backup, Replication, and Failover

Protecting Data and Restoring Services

Backups create recoverable copies of data that can be used after accidental deletion, corruption, security incidents, or infrastructure failures.

Replication copies data between systems or locations. Depending on the architecture, replication may be synchronous or asynchronous.

Synchronous replication confirms that data has been written to multiple locations before completing an operation. It can provide strong consistency but may introduce latency.

Asynchronous replication allows the primary operation to complete before the secondary copy is updated. It can reduce latency but introduces a potential replication lag.

Failover moves application operations from a failed primary environment to an available secondary environment.

Failback returns operations to the original or preferred environment after recovery.

AI systems may require protection for datasets, model artifacts, vector indexes, application configurations, orchestration definitions, and operational metadata.

Backups should be protected against unauthorized modification and deletion.

Organizations should regularly test restoration procedures. A backup that has never been tested should not be assumed to be recoverable.`,
          },
          {
            type: 'check',
            question: "What is an important reason to regularly test backup restoration procedures?",
            options: [
              "To keep the backup storage costs as low as possible",
              "To shorten the time each nightly backup takes to run",
              "To meet the rule that backups must be encrypted",
              "To verify the data can actually be recovered",
            ],
            answer: 3,
            explanation: "Restoration testing verifies that backups are usable and that recovery procedures work as expected.",
          },
        ],
      },
    ],
  },
  {
    id: "cloud-operations-monitoring-finops",
    title: "Cloud Operations, Monitoring and FinOps",
    lessons: [
      {
        id: "cloud-monitoring-observability-and-logging",
        title: "Cloud Monitoring, Observability, and Logging",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# Cloud Monitoring, Observability, and Logging

Operating and Observing Cloud AI Systems

Cloud monitoring and observability help organizations understand the health, performance, and behavior of their infrastructure and applications.

Monitoring tracks predefined metrics such as CPU utilization, memory consumption, network throughput, storage capacity, request rates, and service availability.

Logging records events generated by applications, infrastructure, security services, and operating systems.

Distributed tracing follows requests as they move across multiple services. It helps identify performance bottlenecks and failures in distributed architectures.

The three commonly recognized observability pillars are metrics, logs, and traces.

AI workloads introduce additional monitoring requirements, including model response latency, inference throughput, accelerator utilization, token consumption, model errors, and data pipeline health.

Organizations should establish service-level indicators (SLIs), service-level objectives (SLOs), and alerting policies for critical services.

Effective observability helps operations teams detect problems, investigate incidents, and improve service reliability.`,
          },
          {
            type: 'check',
            question: "Which three capabilities are commonly recognized as the pillars of observability?",
            options: [
              "Backup, replication, and recovery",
              "Authentication, authorization, and encryption",
              "Compute, storage, and networking",
              "Metrics, logs, and traces",
            ],
            answer: 3,
            explanation: "Metrics, logs, and distributed traces provide complementary information about application and infrastructure behavior.",
          },
        ],
      },
      {
        id: "cloud-finops-and-cost-optimization",
        title: "Cloud FinOps and Cost Optimization",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# Cloud FinOps and Cost Optimization

Managing the Financial Operations of Cloud AI

FinOps is an operational framework that brings financial accountability to cloud usage.

It encourages engineering, finance, and business teams to collaborate when making cloud spending decisions.

Cloud costs may include compute instances, GPUs, storage, networking, managed AI services, API requests, data transfer, and monitoring services.

AI workloads can create significant costs because model training and inference may consume expensive accelerator resources.

Cost allocation helps organizations understand which teams, applications, environments, or business units generate cloud expenses.

Tagging resources with ownership, application, environment, and cost-center information improves financial visibility.

Common optimization techniques include rightsizing, autoscaling, scheduling non-production resources, selecting appropriate storage tiers, and removing unused resources.

For AI systems, architects should evaluate model selection, request batching, caching, inference scaling, token consumption, and accelerator utilization.

The goal of FinOps is not simply to minimize spending. It is to maximize business value while maintaining required performance, security, and reliability.`,
          },
          {
            type: 'check',
            question: "Which practice helps organizations attribute cloud spending to specific applications or business units?",
            options: [
              "Separate cloud accounts per region",
              "Reserved instances and savings plans",
              "Resource tagging and cost allocation",
              "Budgets with alerts at the account level",
            ],
            answer: 2,
            explanation: "Resource tagging and cost allocation provide visibility into which teams, applications, and business units are responsible for cloud spending.",
          },
        ],
      },
      {
        id: "cloud-automation-and-incident-management",
        title: "Cloud Automation and Incident Management",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# Cloud Automation and Incident Management

Automating Cloud Operations

Cloud automation reduces repetitive manual work and improves operational consistency.

Infrastructure as Code (IaC) allows infrastructure to be defined and provisioned through version-controlled configuration files.

Tools such as Terraform, AWS CloudFormation, and Azure Bicep can help automate cloud resource provisioning.

Configuration management helps maintain consistent settings across servers and environments.

Automated deployment pipelines can build, test, scan, and release application components.

Incident management provides structured processes for detecting, recording, prioritizing, investigating, and resolving operational disruptions.

A production AI service should have defined incident severity levels, escalation paths, ownership, communication procedures, and recovery runbooks.

Automation can support health checks, scaling, backup execution, alert routing, and recovery actions.

However, automated actions should be governed by appropriate permissions, testing, logging, and approval controls.

Organizations should also conduct post-incident reviews to identify root causes and prevent recurring failures.`,
          },
          {
            type: 'check',
            question: "What is a primary advantage of Infrastructure as Code?",
            options: [
              "Resources scale automatically without any configuration",
              "Infrastructure changes no longer need review or approval",
              "Cloud providers guarantee higher uptime for coded resources",
              "Infrastructure is provisioned consistently from code",
            ],
            answer: 3,
            explanation: "Infrastructure as Code makes infrastructure definitions repeatable, version-controlled, reviewable, and automatable.",
          },
        ],
      },
    ],
  },
  {
    id: "cloud-ai-architecture-capstone",
    title: "Cloud AI Architecture Capstone",
    lessons: [
      {
        id: "enterprise-ai-cloud-architecture-requirements",
        title: "Defining Enterprise AI Cloud Requirements",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# Defining Enterprise AI Cloud Requirements

Translating Business Needs into Architecture Requirements

Enterprise cloud architecture begins with understanding business objectives and translating them into technical requirements.

Consider an organization planning to deploy an AI-powered knowledge assistant for employees.

The solution must securely access approved enterprise documents, answer employee questions, and integrate with existing identity and business systems.

Before selecting cloud services, architects should identify functional requirements such as document ingestion, search, retrieval, model inference, and user interaction.

Non-functional requirements include availability, response time, scalability, security, privacy, compliance, recoverability, and operating cost.

The architecture should identify data sources, integration points, compute requirements, storage needs, network boundaries, identity controls, and external dependencies.

Architects should also identify assumptions, constraints, risks, service limits, and expected workload volumes.

A requirements traceability approach helps connect each business requirement to the architectural components and controls that satisfy it.

The result is a documented foundation for evaluating architecture options and making informed technology decisions.`,
          },
          {
            type: 'check',
            question: "What should an enterprise architect establish before selecting cloud services for an AI solution?",
            options: [
              "The number of cloud accounts the solution will need",
              "The largest GPU configuration that fits the budget",
              "The organization's preferred cloud provider",
              "Business goals, plus functional and non-functional needs",
            ],
            answer: 3,
            explanation: "Architecture decisions should be driven by business objectives and documented functional and non-functional requirements.",
          },
        ],
      },
      {
        id: "designing-secure-scalable-ai-cloud-architecture",
        title: "Designing a Secure and Scalable AI Cloud Architecture",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# Designing a Secure and Scalable AI Cloud Architecture

Building the Reference Architecture

A production enterprise AI architecture combines application services, data platforms, AI services, infrastructure, and security controls.

A representative architecture may include the following layers:

1. User access layer: A web application or enterprise interface through which employees interact with the solution.

2. API and application layer: An API gateway and backend services that authenticate requests, enforce authorization, validate inputs, and coordinate processing.

3. AI orchestration layer: Services that manage prompts, retrieve relevant enterprise information, invoke models, and validate responses.

4. Data layer: Document repositories, object storage, databases, metadata stores, and vector indexes.

5. AI model layer: Managed foundation models or self-hosted models that provide inference capabilities.

6. Infrastructure layer: Compute resources, containers, networking, storage, and deployment environments.

7. Security and operations layer: IAM, encryption, monitoring, logging, governance, cost management, and incident response.

The architecture should enforce user permissions throughout the request lifecycle.

For example, an employee should only retrieve documents that their identity is authorized to access.

The solution should also include rate limiting, error handling, monitoring, scaling policies, and recovery procedures.

A successful architecture balances business value, technical feasibility, security, operational complexity, and cost.`,
          },
          {
            type: 'check',
            question: "In a secure enterprise AI knowledge assistant, what should happen before documents are retrieved for a user?",
            options: [
              "The user's access should be checked against document policies",
              "The model should be told which documents the user may see",
              "Retrieved documents should be filtered after the answer",
              "The user should confirm they have permission to read them",
            ],
            answer: 0,
            explanation: "Authorization must be enforced during retrieval to prevent users from accessing enterprise information they are not permitted to see.",
          },
        ],
      },
      {
        id: "cloud-ai-architecture-design-review",
        title: "Architecture Review and Capstone Assessment",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# Architecture Review and Capstone Assessment

Evaluating and Defending an Enterprise AI Architecture

The final stage of architecture design is evaluating whether the proposed solution satisfies business and technical requirements.

An architecture review should examine security, identity, network segmentation, data protection, scalability, availability, disaster recovery, monitoring, and cost.

Architects should document major design decisions and explain why particular services, deployment models, and integration patterns were selected.

Architecture Decision Records (ADRs) capture important decisions, alternatives considered, and the reasoning behind the selected approach.

A technical review should identify single points of failure, excessive permissions, unmanaged dependencies, performance bottlenecks, and operational risks.

A cost review should evaluate expected infrastructure consumption, managed service pricing, data transfer, storage growth, and AI inference usage.

A security review should evaluate threat scenarios, data access boundaries, credential management, encryption, and audit requirements.

A production readiness assessment should confirm that deployment, monitoring, backup, recovery, support, and incident management processes are established.

For the capstone, design an enterprise AI knowledge assistant architecture and explain how it meets the organization's business requirements.

Your final architecture should include a component diagram, data flow, security boundaries, deployment model, availability strategy, monitoring approach, and cost considerations.

The objective is to demonstrate that cloud AI architecture is not simply selecting services. It is making and defending integrated design decisions that support secure, reliable, and sustainable enterprise solutions.`,
          },
          {
            type: 'check',
            question: "What is the primary purpose of an Architecture Decision Record (ADR)?",
            options: [
              "To capture user stories and acceptance criteria",
              "To record a decision, the alternatives and why",
              "To describe deployment steps for operations",
              "To list every cloud resource and its monthly cost",
            ],
            answer: 1,
            explanation: "An ADR documents an important architecture decision, the alternatives considered, and the reasoning behind the selected approach.",
          },
        ],
      },
    ],
  },
];

runCourseSeed({ course: COURSE, modules: MODULES, script: 'scripts/enterprise-ai-architecture/cloud-architecture-ai-solutions/seed-cloud-architecture-ai-solutions.mjs' }).catch((error) => {
  console.error('\nSEED FAILED:', error);
  process.exit(1);
});
