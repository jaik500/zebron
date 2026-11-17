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

// ============================================================
// COURSE CONFIGURATION
// ============================================================

const COURSE = {
  id: 'mlops-llmops-production-ai-operations',
  title: 'MLOps and LLMOps: Production AI Operations',
  subtitle:
    'Build, deploy, monitor, and govern production machine learning and large language model systems.',
  description:
    'Learn how to operationalize enterprise AI systems using MLOps and LLMOps practices. Explore machine learning lifecycle management, experiment tracking, data pipelines, feature engineering, model registries, CI/CD, model deployment, foundation model operations, AI evaluation, monitoring, governance, and production architecture.',
  level: 'advanced',
  language: 'en',
  category: 'AI Engineering',
  program: 'Enterprise AI & Solutions Architecture',
  programOrder: 9,
  status: 'draft',
  cover: 'violet',
  tags: [
    'MLOps',
    'LLMOps',
    'Machine Learning',
    'AI Engineering',
    'Model Deployment',
    'Model Monitoring',
    'Experiment Tracking',
    'Feature Engineering',
    'CI/CD',
    'Model Registry',
    'LLM Evaluation',
    'AI Governance',
    'Production AI',
  ],
};

// ============================================================
// MODULES
// ============================================================

const MODULES = [

  // MODULE 1: MLOPS AND LLMOPS FOUNDATIONS

  {
    id: 'mlops-llmops-foundations',
    title: 'MLOps and LLMOps Foundations',
    lessons: [
      {
        id: 'introduction-to-mlops',
        title: 'Introduction to MLOps',
        minutes: 5,
        blocks: [
          {
            type: 'video',
            url: 'https://firebasestorage.googleapis.com/v0/b/zebron-2b49f.firebasestorage.app/o/course-videos%2Fmlops-llmops-production-ai-operations-overview.mp4?alt=media&token=26a21115-8a48-46b0-bfab-d9a042d7d2f2',
            caption: 'Course overview: what you will learn, the modules and the skills you will build (about 50 seconds, no sound).',
          },
          {
            type: 'text',
            heading: 'Understanding MLOps',
            content: `
MLOps stands for Machine Learning Operations. It combines machine learning development with software engineering, automation, infrastructure management, and operational practices.

Traditional software applications generally execute logic written directly by developers. Machine learning systems introduce an additional component: models that learn patterns from data.

This creates additional operational responsibilities.

A production machine learning system must manage:

1. Data collection and preparation.
2. Model development and experimentation.
3. Model training and validation.
4. Model deployment.
5. Production monitoring.
6. Model updates and retraining.

MLOps establishes repeatable processes for managing these activities.

It helps organizations improve reproducibility, collaboration, deployment reliability, scalability, and governance.

For example, an enterprise fraud detection system may need to retrain its model periodically as transaction patterns change.

Without MLOps, this process could involve manual data preparation, training, testing, and deployment.

With MLOps, much of the lifecycle can be automated through controlled pipelines.
            `,
          },
          {
            type: 'check',
            question: 'What is the primary purpose of MLOps?',
            options: [
              'To speed up model training by replacing data scientists with automated tools',
              'To store trained models in a central database for later reuse',
              'To manage cloud infrastructure costs for machine learning teams',
              'To operationalize and manage the full machine learning lifecycle',
            ],
            answer: 3,
            explanation:
              'MLOps combines machine learning and operational practices to manage the development, deployment, monitoring, and maintenance of models.',
          },
        ],
      },

      {
        id: 'introduction-to-llmops',
        title: 'Introduction to LLMOps',
        minutes: 5,
        blocks: [
          {
            type: 'text',
            heading: 'Understanding LLMOps',
            content: `
LLMOps stands for Large Language Model Operations.

It applies operational engineering practices to applications that use large language models.

LLM applications introduce requirements that extend beyond traditional machine learning deployment.

These include:

1. Prompt and instruction management.
2. Foundation model selection.
3. Retrieval-augmented generation.
4. Context management.
5. Token usage and cost monitoring.
6. Model response evaluation.
7. Content safety and guardrails.
8. Model and prompt versioning.

For example, an enterprise knowledge assistant may use a foundation model together with internal documents retrieved from a vector database.

The application must manage the model, prompts, retrieval pipeline, document permissions, and generated responses.

LLMOps helps teams manage these components throughout development and production.

Unlike traditional predictive machine learning systems, LLM applications can produce variable natural-language outputs.

This makes evaluation, safety testing, observability, and continuous improvement especially important.
            `,
          },
          {
            type: 'check',
            question: 'Which operational responsibility is particularly important in LLMOps?',
            options: [
              'Tuning hyperparameters for gradient-boosted tree models',
              'Managing prompt versions and evaluating generated responses',
              'Labelling tabular training data for supervised classifiers',
              'Compressing images before they are used for model training',
            ],
            answer: 1,
            explanation:
              'LLMOps includes prompt management, model evaluation, output quality monitoring, safety controls, and operational cost management.',
          },
        ],
      },

      {
        id: 'mlops-vs-llmops',
        title: 'MLOps vs. LLMOps: Architecture and Responsibilities',
        minutes: 5,
        blocks: [
          {
            type: 'text',
            heading: 'Comparing MLOps and LLMOps',
            content: `
MLOps and LLMOps share many operational principles, but they address different characteristics of AI systems.

MLOps commonly focuses on:

- Dataset management.
- Feature engineering.
- Model training.
- Experiment tracking.
- Model versioning.
- Model deployment.
- Prediction monitoring.
- Model retraining.

LLMOps commonly focuses on:

- Foundation model management.
- Prompt engineering and versioning.
- Context and token management.
- Retrieval-augmented generation.
- Response evaluation.
- Content safety.
- Inference cost optimization.
- LLM application observability.

There is significant overlap between the two disciplines.

Both require automation, version control, testing, security, deployment management, monitoring, and governance.

An enterprise may operate traditional predictive models and generative AI applications simultaneously.

Its architecture should therefore support shared operational capabilities while recognizing the unique requirements of each workload.

The objective is to establish a consistent operational framework for the organization's entire AI portfolio.
            `,
          },
          {
            type: 'check',
            question: 'Which capability is especially associated with LLMOps compared with traditional MLOps?',
            options: [
              'Tracking experiments and comparing training metrics',
              'Registering model versions with their artifacts and metadata',
              'Monitoring incoming data for drift after deployment',
              'Prompt versioning and evaluation of generated responses',
            ],
            answer: 3,
            explanation:
              'LLMOps places particular emphasis on prompt management, generated response evaluation, context handling, and foundation model operations.',
          },
        ],
      },
    ],
  },

  // MODULE 2: ML LIFECYCLE AND EXPERIMENT MANAGEMENT

  {
    id: 'ml-lifecycle-experiment-management',
    title: 'ML Lifecycle and Experiment Management',
    lessons: [
      {
        id: 'machine-learning-lifecycle',
        title: 'Understanding the Machine Learning Lifecycle',
        minutes: 5,
        blocks: [
          {
            type: 'text',
            heading: 'Managing the End-to-End ML Lifecycle',
            content: `
The machine learning lifecycle describes the stages involved in developing, deploying, and maintaining machine learning solutions.

A typical lifecycle includes:

1. Business problem definition.
2. Data collection.
3. Data exploration and preparation.
4. Feature engineering.
5. Model training.
6. Model evaluation.
7. Model deployment.
8. Production monitoring.
9. Retraining and improvement.

The lifecycle is iterative rather than strictly linear.

For example, evaluation may reveal that the training dataset does not adequately represent real-world conditions.

The engineering team may need to return to data preparation or feature engineering before training another model.

Production monitoring may also reveal changes in data distributions or model performance.

MLOps makes these activities more repeatable through automated pipelines, versioned artifacts, and controlled workflows.

Architects should ensure that every lifecycle stage has clear ownership, inputs, outputs, and quality controls.
            `,
          },
          {
            type: 'check',
            question: 'Why is the machine learning lifecycle considered iterative?',
            options: [
              'Evaluation and monitoring results can send teams back to earlier stages',
              'Each model must be retrained from scratch for every release',
              'Data scientists hand finished models to operations in a single step',
              'Deployment happens before data preparation in most projects',
            ],
            answer: 0,
            explanation:
              'Machine learning development is iterative because evaluation results and production feedback can require changes to data, features, models, and deployment configurations.',
          },
        ],
      },

      {
        id: 'experiment-tracking-and-reproducibility',
        title: 'Experiment Tracking and Reproducibility',
        minutes: 5,
        blocks: [
          {
            type: 'text',
            heading: 'Tracking Machine Learning Experiments',
            content: `
Machine learning development often involves running many experiments with different datasets, algorithms, parameters, and configurations.

Experiment tracking records the information required to understand and reproduce each experiment.

Commonly tracked information includes:

- Experiment name and identifier.
- Dataset version.
- Model architecture.
- Hyperparameters.
- Training configuration.
- Evaluation metrics.
- Code version.
- Execution environment.
- Model artifacts.

For example, a team may train a classification model using different learning rates and batch sizes.

Without experiment tracking, it becomes difficult to determine which configuration produced the best result.

Tools such as MLflow can help manage experiments, parameters, metrics, and artifacts.

Reproducibility means being able to recreate an experiment using its recorded inputs and configuration.

Exact reproducibility may be affected by nondeterministic operations, hardware differences, and distributed execution.

Nevertheless, versioning datasets, code, dependencies, and configurations makes experiments easier to audit and reproduce.
            `,
          },
          {
            type: 'check',
            question: 'Which information is important for reproducing a machine learning experiment?',
            options: [
              'Final accuracy score, model name, owner and training date',
              'Hardware type, cloud region and total training cost',
              'Data version, code version, parameters and configuration',
              'Model owner, approval status and deployment target',
            ],
            answer: 2,
            explanation:
              'Reproducibility requires recording the important inputs and configuration used to produce an experiment, including data, code, parameters, and environment details.',
          },
        ],
      },

      {
        id: 'hyperparameter-tuning-and-model-selection',
        title: 'Hyperparameter Tuning and Model Selection',
        minutes: 5,
        blocks: [
          {
            type: 'text',
            heading: 'Optimizing Machine Learning Models',
            content: `
Hyperparameters are configuration values selected before or during the training process rather than learned directly as model parameters.

Examples include:

- Learning rate.
- Batch size.
- Number of training epochs.
- Tree depth.
- Regularization strength.
- Number of hidden layers.

Hyperparameter tuning evaluates different configurations to identify combinations that produce acceptable model performance.

Grid search evaluates combinations from a predefined parameter space.

Random search samples parameter combinations from a defined distribution.

Bayesian optimization uses information from previous evaluations to guide the selection of new configurations.

Model selection compares candidate models using appropriate evaluation metrics.

The correct metric depends on the business problem.

For example, a fraud detection system may prioritize recall because missing fraudulent transactions could be expensive.

However, precision also matters because excessive false positives can create unnecessary investigations.

Architects and machine learning engineers should ensure that model selection considers business impact, performance, operational complexity, and deployment cost.
            `,
          },
          {
            type: 'check',
            question: 'What is the purpose of hyperparameter tuning?',
            options: [
              'To find configuration values that improve model performance',
              'To learn the model\'s weights directly from the training data',
              'To select which input features the model should use',
              'To split the dataset into training, validation and test sets',
            ],
            answer: 0,
            explanation:
              "Hyperparameter tuning evaluates different configurations to identify settings that improve the model's performance.",
          },
        ],
      },
    ],
  },

  // MODULE 3: DATA AND FEATURE PIPELINE ENGINEERING

  {
    id: 'data-feature-pipeline-engineering',
    title: 'Data and Feature Pipeline Engineering',
    lessons: [
      {
        id: 'ml-data-ingestion-and-validation',
        title: 'Machine Learning Data Ingestion and Validation',
        minutes: 5,
        blocks: [
          {
            type: 'text',
            heading: 'Building Reliable Data Ingestion Pipelines',
            content: `
Machine learning systems depend on reliable data pipelines.

Data ingestion collects information from source systems and makes it available for downstream processing.

Sources may include:

- Relational databases.
- Application programming interfaces.
- Cloud object storage.
- Event streams.
- Enterprise applications.
- External data providers.

Data may be ingested in batches or continuously through streaming pipelines.

Validation checks whether incoming data satisfies expected quality requirements.

Common validation rules include:

- Required fields must exist.
- Data types must be correct.
- Values must fall within acceptable ranges.
- Identifiers must follow expected formats.
- Records must satisfy business rules.

Data quality problems can negatively affect model training and predictions.

For example, a financial model trained using incorrect transaction amounts may learn misleading patterns.

A production pipeline should include validation, error handling, logging, retry mechanisms, and mechanisms for isolating invalid records.

Reliable ingestion provides the foundation for trustworthy machine learning systems.
            `,
          },
          {
            type: 'check',
            question: 'What is the primary purpose of data validation in an ML pipeline?',
            options: [
              "To check incoming data meets quality and structure rules",
              "To convert raw data into features the model can use",
              "To balance classes so the model learns each outcome equally",
              "To compress data so pipelines run faster and cost less",
            ],
            answer: 0,
            explanation:
              'Data validation identifies missing, malformed, inconsistent, or otherwise invalid information before it enters downstream processing.',
          },
        ],
      },

      {
        id: 'feature-engineering-and-feature-stores',
        title: 'Feature Engineering and Feature Stores',
        minutes: 5,
        blocks: [
          {
            type: 'text',
            heading: 'Managing Features for Machine Learning',
            content: `
Feature engineering transforms raw data into useful inputs that machine learning models can consume.

A feature is an individual measurable property used by a model.

For example, a customer churn model might use:

- Customer account age.
- Number of support requests.
- Monthly spending.
- Recent product usage.
- Subscription history.

Feature engineering may involve normalization, encoding, aggregation, transformation, and combining multiple data sources.

A feature store is a system for managing and serving reusable features.

Feature stores commonly support offline and online feature access.

An offline feature store provides historical data for training and analysis.

An online feature store provides low-latency feature retrieval for production inference.

Feature stores help teams reuse features, maintain consistency, and reduce duplicated engineering work.

A major architectural concern is training-serving skew.

This occurs when features are calculated differently during training and production inference.

Consistent feature definitions and transformations help reduce this risk.
            `,
          },
          {
            type: 'check',
            question: 'What is training-serving skew?',
            options: [
              "A drop in accuracy caused by real-world data changing over time",
              "A delay between a prediction request and the model's response",
              "A model fitting its training data too closely to generalize well",
              "Features computed differently in training than in production",
            ],
            answer: 3,
            explanation:
              'Training-serving skew occurs when the features or transformations used during training differ from those used when serving predictions.',
          },
        ],
      },

      {
        id: 'data-versioning-and-pipeline-orchestration',
        title: 'Data Versioning and Pipeline Orchestration',
        minutes: 5,
        blocks: [
          {
            type: 'text',
            heading: 'Versioning and Orchestrating ML Data Pipelines',
            content: `
Data versioning records changes to datasets so teams can identify which data was used for a particular model or experiment.

This is important because a model's behavior depends on its training data.

Versioning can capture dataset snapshots, metadata, source information, and transformation history.

Pipeline orchestration coordinates the execution of data and machine learning tasks.

An orchestration workflow may include:

1. Extracting data.
2. Validating incoming records.
3. Transforming raw data.
4. Generating features.
5. Splitting datasets.
6. Starting model training.
7. Evaluating the trained model.
8. Registering approved artifacts.

Dependencies determine the correct execution order.

For example, model training should not begin until the required dataset preparation steps have completed successfully.

Workflow orchestration platforms can manage scheduling, dependencies, retries, execution status, and failure notifications.

Architects should also consider idempotency, which means repeating an operation should not create unintended duplicate effects.

Versioned data and orchestrated workflows improve traceability, reliability, and reproducibility across the machine learning lifecycle.
            `,
          },
          {
            type: 'check',
            question: 'Why is data versioning important in an MLOps environment?',
            options: [
              "It keeps the latest dataset synchronized across every environment",
              "It reduces storage costs by removing duplicate records",
              "It records which dataset produced a model or experiment",
              "It validates that incoming data matches the expected schema",
            ],
            answer: 2,
            explanation:
              'Data versioning provides traceability by identifying which dataset and data state were used during model development and training.',
          },
        ],
      },
    ],
  },

  // SECTION 2 WILL CONTINUE HERE.
    // MODULE 4: MODEL TRAINING AND EXPERIMENT TRACKING

  {
    id: 'model-training-experiment-tracking',
    title: 'Model Training and Experiment Tracking',
    lessons: [
      {
        id: 'automated-model-training-pipelines',
        title: 'Automated Model Training Pipelines',
        minutes: 5,
        blocks: [
          {
            type: 'text',
            heading: 'Automating Model Training',
            content: `
Automated model training pipelines standardize how machine learning models are trained and evaluated.

Instead of manually executing scripts and managing training environments, teams define repeatable workflows that execute predefined tasks.

A typical training pipeline includes:

1. Dataset retrieval.
2. Data validation.
3. Feature preparation.
4. Training environment initialization.
5. Model training.
6. Model evaluation.
7. Artifact generation.
8. Model registration.

Each stage should have defined inputs, outputs, and execution requirements.

For example, a pipeline may retrieve a versioned dataset from cloud object storage, prepare the features, execute a training job, and calculate evaluation metrics.

If a stage fails, the pipeline should record the failure and prevent invalid artifacts from progressing into later stages.

Automated training pipelines improve consistency, reproducibility, and operational efficiency.

They also make it easier to execute training workflows across development, testing, and production environments.
            `,
          },
          {
            type: 'check',
            question: 'What is a primary advantage of automated model training pipelines?',
            options: [
              'They guarantee that each new model is more accurate than the last',
              'They remove the need to evaluate models before deployment',
              'They make training workflows repeatable and consistent',
              'They let models train without any versioned training data',
            ],
            answer: 2,
            explanation:
              'Automated pipelines standardize training tasks and make machine learning workflows more repeatable, consistent, and manageable.',
          },
        ],
      },

      {
        id: 'distributed-model-training',
        title: 'Distributed Model Training',
        minutes: 5,
        blocks: [
          {
            type: 'text',
            heading: 'Scaling Model Training Across Compute Resources',
            content: `
Distributed training allows machine learning workloads to execute across multiple processors, GPUs, or compute instances.

It is particularly useful when datasets or models exceed the practical capacity of a single machine.

Two common approaches are data parallelism and model parallelism.

Data parallelism distributes different portions of a training dataset across multiple workers. Each worker processes its assigned data and contributes to model updates.

Model parallelism divides a model across multiple devices when the model cannot efficiently fit into the memory of one device.

Distributed training introduces additional architectural requirements:

- High-performance networking.
- Worker coordination.
- Parameter synchronization.
- Shared or distributed storage.
- Resource scheduling.
- Failure handling.

For example, an enterprise may train a large neural network using multiple GPU instances in a cloud environment.

The training framework coordinates communication between workers so that the model can be updated correctly.

Architects must evaluate communication overhead, hardware utilization, scalability, and cost.

Distributed training is valuable when workload requirements justify the additional infrastructure and operational complexity.
            `,
          },
          {
            type: 'check',
            question: 'What does data parallelism do during distributed model training?',
            options: [
              "It splits the model's layers across workers, each holding part",
              "It runs several models in parallel and keeps the best one",
              "It sends inference requests to the least busy worker",
              "It splits the data across workers that each hold the model",
            ],
            answer: 3,
            explanation:
              'Data parallelism allows multiple workers to process different portions of the training data and contribute to model updates.',
          },
        ],
      },

      {
        id: 'training-metrics-and-model-evaluation',
        title: 'Training Metrics and Model Evaluation',
        minutes: 5,
        blocks: [
          {
            type: 'text',
            heading: 'Evaluating Model Performance',
            content: `
Model evaluation measures how well a trained machine learning model performs against defined objectives.

Different machine learning tasks require different evaluation metrics.

For classification problems, common metrics include:

- Accuracy.
- Precision.
- Recall.
- F1 score.
- Area Under the ROC Curve (ROC-AUC).

For regression problems, common metrics include:

- Mean Absolute Error (MAE).
- Mean Squared Error (MSE).
- Root Mean Squared Error (RMSE).
- R-squared.

Training metrics describe model performance during training.

Validation metrics help assess performance on data not used to directly fit the model.

A separate test dataset provides an additional assessment of generalization.

Overfitting occurs when a model learns the training data too closely and performs poorly on unseen data.

Underfitting occurs when a model is too simple or insufficiently trained to capture important patterns.

Evaluation should also consider business requirements.

For example, a fraud detection model may prioritize recall to identify as many fraudulent transactions as possible, while also considering the cost of false positives.

Model evaluation provides evidence for deciding whether a model is suitable for deployment.
            `,
          },
          {
            type: 'check',
            question: 'What is overfitting?',
            options: [
              'The model performs poorly on both training data and unseen data',
              'The model\'s predictions change as production data shifts over time',
              'The model performs well on training data but poorly on unseen data',
              'The model is too large to serve within the latency budget',
            ],
            answer: 2,
            explanation:
              'Overfitting occurs when a model learns the training data too closely and fails to generalize effectively to unseen data.',
          },
        ],
      },
    ],
  },

  // MODULE 5: MODEL REGISTRY AND VERSION MANAGEMENT

  {
    id: 'model-registry-version-management',
    title: 'Model Registry and Version Management',
    lessons: [
      {
        id: 'model-registry-fundamentals',
        title: 'Model Registry Fundamentals',
        minutes: 5,
        blocks: [
          {
            type: 'text',
            heading: 'Managing Models Through a Registry',
            content: `
A model registry is a centralized system for managing machine learning models and their associated metadata.

It provides a structured location where teams can track trained models, versions, artifacts, and deployment-related information.

A model registry commonly stores:

- Model name and identifier.
- Model version.
- Training experiment reference.
- Model artifacts.
- Evaluation metrics.
- Framework and dependency information.
- Creation timestamp.
- Model owner.
- Approval and deployment status.

For example, an enterprise fraud detection model may have several candidate versions created during experimentation.

The registry allows teams to identify the model that passed evaluation and was approved for production.

Tools such as MLflow Model Registry provide capabilities for model registration, version tracking, metadata management, and lifecycle organization.

A registry improves collaboration between data scientists, machine learning engineers, and platform operations teams.

It also supports auditability by connecting deployed models to their development and evaluation history.
            `,
          },
          {
            type: 'check',
            question: 'What is the primary purpose of a model registry?',
            options: [
              'To record every experiment run with its parameters and metrics',
              'To manage model versions, artifacts and metadata in one place',
              'To store the features used for training and online inference',
              'To schedule and run training pipelines on shared compute',
            ],
            answer: 1,
            explanation:
              'A model registry provides centralized management of machine learning models, including their versions, artifacts, metadata, and lifecycle information.',
          },
        ],
      },

      {
        id: 'model-versioning-and-lineage',
        title: 'Model Versioning and Lineage',
        minutes: 5,
        blocks: [
          {
            type: 'text',
            heading: 'Tracking Model Versions and Lineage',
            content: `
Model versioning identifies different iterations of a machine learning model.

A new model version may result from updated training data, revised features, different hyperparameters, a new algorithm, or changes to the training process.

Model lineage records the relationships between the model and the assets used to create it.

These assets may include:

- Source code.
- Dataset versions.
- Feature definitions.
- Training configurations.
- Experiment identifiers.
- Evaluation results.
- Model artifacts.

Lineage makes it possible to investigate how a particular model was produced.

For example, if a production model generates unexpected predictions, an engineering team can examine its training dataset, code version, and experiment history.

Versioning also supports controlled rollback.

If a newly deployed model performs poorly, the organization can restore a previously approved version.

Architects should ensure that model versions are immutable or otherwise protected against uncontrolled modification.

Model lineage improves traceability, reproducibility, and accountability across the AI lifecycle.
            `,
          },
          {
            type: 'check',
            question: 'What does model lineage help an organization understand?',
            options: [
              "Which model version is serving production traffic right now",
              "How a model was produced: its data, code and configuration",
              "How a model's accuracy has changed since it was deployed",
              "Who approved the model and when it was promoted to production",
            ],
            answer: 1,
            explanation:
              'Model lineage connects a model to its source data, code, configuration, experiments, and evaluation history.',
          },
        ],
      },

      {
        id: 'model-approval-and-promotion',
        title: 'Model Approval and Promotion',
        minutes: 5,
        blocks: [
          {
            type: 'text',
            heading: 'Controlling Model Promotion Across Environments',
            content: `
Model promotion is the controlled movement of a model from one lifecycle stage to another.

An organization may define stages such as:

1. Development.
2. Evaluation.
3. Validation.
4. Staging.
5. Production.
6. Archived.

A model should not automatically become a production model simply because training completed successfully.

It should satisfy defined quality, security, operational, and governance requirements.

Approval criteria may include:

- Minimum evaluation metrics.
- Data quality requirements.
- Security review.
- Bias and fairness assessment where appropriate.
- Performance testing.
- Business stakeholder approval.
- Operational readiness.

Some organizations use automated policies to determine whether a model qualifies for promotion.

Other organizations require a human reviewer to approve production deployment.

Model promotion workflows help enforce separation of duties and prevent unvalidated models from reaching production.

Architects should define who can approve, promote, deploy, or retire models.

These controls are particularly important in regulated and high-impact environments.
            `,
          },
          {
            type: 'check',
            question: 'Why should model promotion require defined approval criteria?',
            options: [
              'To confirm quality, security and governance checks pass first',
              'To make sure the newest model always replaces the current one',
              'To give every team the same access to all model versions',
              'To record which engineer trained each model version',
            ],
            answer: 0,
            explanation:
              'Model promotion controls help ensure that only models meeting organizational requirements are approved for production deployment.',
          },
        ],
      },
    ],
  },

  // MODULE 6: CI/CD AND CONTINUOUS TRAINING

  {
    id: 'cicd-continuous-training',
    title: 'CI/CD and Continuous Training',
    lessons: [
      {
        id: 'ci-cd-fundamentals-for-ml',
        title: 'CI/CD Fundamentals for Machine Learning',
        minutes: 5,
        blocks: [
          {
            type: 'text',
            heading: 'Applying CI/CD to Machine Learning',
            content: `
Continuous Integration (CI) and Continuous Delivery or Deployment (CD) automate the process of building, testing, and releasing software.

In machine learning environments, CI/CD extends beyond application code.

It may also validate:

- Data processing code.
- Feature engineering logic.
- Model training code.
- Model configuration.
- Inference APIs.
- Deployment manifests.
- Infrastructure definitions.

A CI pipeline may execute automated tests whenever developers submit changes.

These tests can include unit tests, integration tests, data validation, code quality checks, and security scans.

A CD pipeline can package approved artifacts and deploy them to staging or production environments.

Machine learning CI/CD must account for model artifacts and data dependencies in addition to traditional application components.

For example, changing a feature transformation function may affect both training and inference behavior.

Architects should design pipelines that validate these changes before deployment.

CI/CD improves release consistency, reduces manual errors, and supports controlled delivery of AI applications.
            `,
          },
          {
            type: 'check',
            question: 'What additional concern must machine learning CI/CD pipelines address compared with traditional software pipelines?',
            options: [
              "Source code compilation, unit tests and container images",
              "User interface changes, API contracts and documentation",
              "Model artifacts, data dependencies and feature logic",
              "Branching strategy, code review and merge approval rules",
            ],
            answer: 2,
            explanation:
              'Machine learning pipelines must validate not only application code but also data dependencies, feature transformations, model artifacts, and model-related configurations.',
          },
        ],
      },

      {
        id: 'continuous-training-and-retraining',
        title: 'Continuous Training and Model Retraining',
        minutes: 5,
        blocks: [
          {
            type: 'text',
            heading: 'Automating Model Retraining',
            content: `
Continuous Training (CT) automates the process of training or retraining machine learning models as new data or conditions become available.

A model may need retraining when:

- New training data becomes available.
- Model performance declines.
- Data distributions change.
- Business requirements change.
- New features become available.

Retraining can be triggered by a schedule, new data arrival, monitoring alerts, or an approved manual request.

However, new data should not automatically result in production deployment.

A retraining pipeline should validate incoming data, execute training, evaluate the candidate model, and compare it with the currently deployed version.

A candidate model should only be promoted when it satisfies defined acceptance criteria.

For example, an organization may retrain a demand forecasting model weekly using updated sales information.

The new candidate model can be evaluated against the existing production model before approval.

Continuous training helps organizations keep models relevant while maintaining controlled deployment processes.
            `,
          },
          {
            type: 'check',
            question: 'What should happen after a continuous training pipeline produces a new candidate model?',
            options: [
              "It should replace the production model as soon as training ends",
              "It should be evaluated against acceptance criteria first",
              "It should be deployed to all users and monitored for problems",
              "It should be archived until the next scheduled release window",
            ],
            answer: 1,
            explanation:
              'A retrained model must be evaluated and approved against defined criteria before it replaces a production model.',
          },
        ],
      },

      {
        id: 'ml-pipeline-testing-and-release-strategies',
        title: 'ML Pipeline Testing and Release Strategies',
        minutes: 5,
        blocks: [
          {
            type: 'text',
            heading: 'Testing and Releasing Machine Learning Systems',
            content: `
Machine learning release processes require testing at multiple levels.

Unit testing validates individual functions and components.

Integration testing verifies that services and pipeline components work together correctly.

Data validation tests check schemas, missing values, ranges, and other quality requirements.

Model testing evaluates predictive behavior using appropriate metrics and representative datasets.

Inference testing verifies that deployed models accept requests and return responses in the expected format.

Performance testing evaluates throughput, latency, concurrency, and resource consumption.

Security testing examines access controls, vulnerabilities, secrets, and dependencies.

Common release strategies include:

Blue-green deployment: Two environments are maintained, allowing traffic to move from an existing version to a new version.

Canary deployment: A small portion of production traffic is routed to a new version before broader rollout.

Shadow deployment: A new model receives copies of production requests without controlling the actual user-facing response.

These strategies reduce deployment risk and allow teams to evaluate new model versions under controlled conditions.

Architects should also define rollback procedures so that an unsuccessful release can be reversed safely.
            `,
          },
          {
            type: 'check',
            question: 'What is the purpose of shadow deployment in a machine learning environment?',
            options: [
              "To test a new model on live traffic without serving its output",
              "To send a small share of live traffic to a new model, then expand",
              "To run two full environments and switch all traffic at once",
              "To compare two models by splitting users into experiment groups",
            ],
            answer: 0,
            explanation:
              'Shadow deployment allows a candidate model to process production requests for evaluation while the existing model continues serving the actual responses.',
          },
        ],
      },
    ],
  },

  // SECTION 3 WILL CONTINUE HERE.
    // MODULE 7: MODEL DEPLOYMENT AND SERVING

  {
    id: 'model-deployment-serving',
    title: 'Model Deployment and Serving',
    lessons: [
      {
        id: 'model-serving-architectures',
        title: 'Model Serving Architectures',
        minutes: 5,
        blocks: [
          {
            type: 'text',
            heading: 'Making Models Available to Applications',
            content: `
Model serving makes trained machine learning models available to applications and users.

A deployed model receives input data, executes inference, and returns predictions or generated results.

Common serving architectures include:

1. REST API endpoints.
2. gRPC services.
3. Batch inference systems.
4. Streaming inference services.
5. Embedded model execution.

Online inference processes requests as they arrive. It is useful for applications requiring immediate predictions.

Batch inference processes groups of records together. It is useful for scheduled scoring, reporting, and large-scale prediction workloads.

Streaming inference processes continuous event streams and supports applications that require continuously updated predictions.

A model-serving architecture may include an API gateway, authentication layer, inference service, model runtime, and supporting data services.

Architects must consider latency, throughput, concurrency, availability, model loading time, and resource consumption.

The selected architecture should reflect the business requirements and expected workload patterns.
            `,
          },
          {
            type: 'check',
            question: 'Which inference pattern is most appropriate when an application requires an immediate prediction for each incoming request?',
            options: [
              'Scheduled batch inference',
              'Streaming feature computation',
              'Offline model evaluation',
              'Online (real-time) inference',
            ],
            answer: 3,
            explanation:
              'Online inference processes individual requests as they arrive and returns predictions to the requesting application.',
          },
        ],
      },

      {
        id: 'inference-scaling-and-performance',
        title: 'Inference Scaling and Performance Optimization',
        minutes: 5,
        blocks: [
          {
            type: 'text',
            heading: 'Scaling Production Inference',
            content: `
Production inference systems must handle changing request volumes while maintaining acceptable response times.

Horizontal scaling increases capacity by adding more inference instances.

Vertical scaling increases the resources assigned to an existing instance.

Autoscaling adjusts capacity according to demand and configured policies.

Several techniques can improve inference efficiency.

Request batching groups multiple inference requests together to improve processing efficiency.

Caching stores reusable results so that repeated requests do not always require full model execution.

Model quantization reduces numerical precision to decrease memory usage and potentially improve inference performance.

Model optimization techniques can reduce model size and computational requirements.

Architects should monitor:

- Request throughput.
- Average latency.
- Percentile latency.
- Error rates.
- Memory utilization.
- CPU and GPU utilization.
- Queue depth.
- Model loading time.

Performance optimization requires balancing latency, accuracy, throughput, infrastructure capacity, and cost.

A system designed for high throughput may make different trade-offs from one designed for extremely low response latency.
            `,
          },
          {
            type: 'check',
            question: 'What is the purpose of request batching in model inference?',
            options: [
              'To spread requests across replicas so no single server is overloaded',
              'To group several requests so the hardware processes them more efficiently',
              'To store recent predictions so repeated requests return instantly',
              'To shrink the model so each request needs less memory',
            ],
            answer: 1,
            explanation:
              'Request batching processes multiple requests together and can improve throughput and hardware utilization.',
          },
        ],
      },

      {
        id: 'deployment-rollbacks-and-model-release',
        title: 'Model Deployment, Rollbacks, and Release Management',
        minutes: 5,
        blocks: [
          {
            type: 'text',
            heading: 'Managing Model Releases in Production',
            content: `
Production model deployment requires controlled release procedures.

A model release should identify the model version, serving configuration, dependencies, and deployment environment.

Before deployment, teams should validate the candidate model and confirm that the infrastructure can support its workload.

Blue-green deployment maintains two environments. Traffic can move from the existing environment to the new environment after validation.

Canary deployment gradually exposes a new model version to a limited percentage of production traffic.

Shadow deployment allows a candidate model to process copies of production requests without controlling the actual user-facing response.

Rollback restores a previously approved model or deployment configuration when a release introduces problems.

A reliable rollback process should account for model artifacts, application compatibility, configuration changes, and data dependencies.

Deployment automation should record release events and identify which model version is serving production traffic.

Architects should define release approvals, health checks, monitoring requirements, and rollback conditions before production deployment.
            `,
          },
          {
            type: 'check',
            question: 'What is the primary purpose of a model rollback procedure?',
            options: [
              "To gradually move traffic from the old model to the new one",
              "To retrain the model on fresh data after a failed release",
              "To restore a known-good model when a release fails",
              "To keep a copy of every model version for later audits",
            ],
            answer: 2,
            explanation:
              'Rollback procedures allow teams to restore a known-good model or deployment configuration after an unsuccessful release.',
          },
        ],
      },
    ],
  },

  // MODULE 8: LLMOPS AND FOUNDATION MODEL MANAGEMENT

  {
    id: 'llmops-foundation-model-management',
    title: 'LLMOps and Foundation Model Management',
    lessons: [
      {
        id: 'foundation-model-lifecycle-management',
        title: 'Foundation Model Lifecycle Management',
        minutes: 5,
        blocks: [
          {
            type: 'text',
            heading: 'Managing Foundation Models',
            content: `
Foundation models are large models trained on broad datasets that can support multiple downstream applications.

Organizations may consume foundation models through managed APIs or operate selected models within their own infrastructure.

Foundation model management includes:

- Model selection.
- Provider evaluation.
- Model version tracking.
- Access control.
- Deployment configuration.
- Performance evaluation.
- Cost monitoring.
- Retirement and replacement.

An organization may use different models for summarization, classification, information extraction, and conversational applications.

Model selection should consider capability, latency, context window, pricing, supported modalities, regional availability, security, and contractual requirements.

Model version changes can affect response quality, behavior, latency, and cost.

Production systems should record which model version was used for important requests.

Architects should also establish procedures for evaluating new model versions before adopting them in production.

Foundation model management helps organizations maintain control over their generative AI portfolio.
            `,
          },
          {
            type: 'check',
            question: 'Why should an organization track foundation model versions?',
            options: [
              'To guarantee identical outputs for identical prompts',
              'To reduce token costs by caching earlier responses',
              'To know which model version produced a particular response',
              'To fine-tune the model automatically when a new version appears',
            ],
            answer: 2,
            explanation:
              'Model version tracking supports troubleshooting, reproducibility, change management, and evaluation of model behavior.',
          },
        ],
      },

      {
        id: 'prompt-management-and-versioning',
        title: 'Prompt Management and Versioning',
        minutes: 5,
        blocks: [
          {
            type: 'text',
            heading: 'Managing Prompts as Production Assets',
            content: `
Prompts provide instructions and context that guide large language model behavior.

In production applications, prompts should be managed as controlled application assets rather than informal text embedded throughout source code.

Prompt management includes:

- Prompt templates.
- System instructions.
- Input variables.
- Version identifiers.
- Evaluation results.
- Ownership.
- Approval history.

A prompt template may define reusable instructions with variables supplied at runtime.

For example, an enterprise summarization application may use a standard prompt containing a document variable and a required output format.

Versioning makes it possible to compare prompt changes and identify which version was used in production.

Prompt changes should be tested because small wording differences can affect response quality, formatting, and model behavior.

Prompt evaluation may include correctness, relevance, completeness, instruction following, and safety.

Sensitive information should not be unnecessarily embedded in prompts or exposed through prompt logs.

Architects should establish prompt review, testing, deployment, and rollback procedures.
            `,
          },
          {
            type: 'check',
            question: 'Why should production prompts be version controlled?',
            options: [
              'To stop prompts from being changed once they reach production',
              'To track changes and measure their effect on model behavior',
              'To reduce token usage by reusing the same prompt everywhere',
              'To let users edit prompts directly in the application',
            ],
            answer: 1,
            explanation:
              'Prompt versioning supports controlled changes, testing, comparison, troubleshooting, and rollback.',
          },
        ],
      },

      {
        id: 'rag-operations-and-knowledge-pipelines',
        title: 'RAG Operations and Knowledge Pipelines',
        minutes: 5,
        blocks: [
          {
            type: 'text',
            heading: 'Operating Retrieval-Augmented Generation Systems',
            content: `
Retrieval-Augmented Generation (RAG) combines information retrieval with large language model generation.

Rather than relying only on information learned during model training, a RAG application retrieves relevant information from an external knowledge source.

A typical RAG pipeline includes:

1. Document ingestion.
2. Document parsing.
3. Text extraction.
4. Chunking.
5. Embedding generation.
6. Vector indexing.
7. Similarity search.
8. Context construction.
9. Model inference.
10. Response generation.

Production RAG systems require ongoing operational management.

Documents may change, become obsolete, or require removal.

Knowledge pipelines should support incremental updates, deletion handling, metadata management, and re-indexing.

Retrieval quality should be monitored because irrelevant or incomplete context can negatively affect generated responses.

Access control is especially important.

A RAG system should enforce document authorization during retrieval rather than relying only on the language model to avoid revealing restricted information.

Operational monitoring should cover ingestion failures, indexing delays, retrieval latency, embedding usage, and model response quality.
            `,
          },
          {
            type: 'check',
            question: 'Where should authorization be enforced in an enterprise RAG application?',
            options: [
              'In the user interface, by hiding restricted answers',
              'During document retrieval, before content reaches the model',
              'After generation, by filtering the model\'s response',
              'In the system prompt, by telling the model what to withhold',
            ],
            answer: 1,
            explanation:
              'Authorization must be enforced during retrieval so the system does not provide unauthorized documents as model context.',
          },
        ],
      },
    ],
  },

  // MODULE 9: AI EVALUATION, TESTING AND QUALITY ASSURANCE

  {
    id: 'ai-evaluation-testing-quality-assurance',
    title: 'AI Evaluation, Testing and Quality Assurance',
    lessons: [
      {
        id: 'llm-evaluation-methodologies',
        title: 'LLM Evaluation Methodologies',
        minutes: 5,
        blocks: [
          {
            type: 'text',
            heading: 'Evaluating Large Language Model Applications',
            content: `
Evaluating large language model applications requires more than checking whether the model returns a response.

Evaluation should determine whether the output is useful, relevant, accurate, safe, and aligned with the application's requirements.

Common evaluation dimensions include:

- Correctness.
- Relevance.
- Completeness.
- Faithfulness to supplied context.
- Instruction following.
- Response consistency.
- Safety.
- Formatting compliance.

An evaluation dataset contains representative inputs and expected outcomes or assessment criteria.

A team can use this dataset to compare model versions, prompt versions, and application configurations.

Automated metrics can measure selected characteristics, while human reviewers can assess more subjective qualities.

LLM-as-a-judge approaches use another model to evaluate generated responses against defined criteria.

However, automated judges may introduce their own biases and inconsistencies.

A strong evaluation strategy combines repeatable automated tests with human review where appropriate.

Evaluation should occur before production deployment and continue as the application evolves.
            `,
          },
          {
            type: 'check',
            question: 'What is the purpose of an LLM evaluation dataset?',
            options: [
              "To supply extra training examples for fine-tuning the model",
              "To store production conversations for later analysis",
              "To measure the model's latency and cost per request",
              "Representative inputs and criteria for judging outputs",
            ],
            answer: 3,
            explanation:
              'Evaluation datasets provide repeatable examples for measuring model and application behavior across versions and configurations.',
          },
        ],
      },

      {
        id: 'automated-ai-testing-and-regression',
        title: 'Automated AI Testing and Regression Testing',
        minutes: 5,
        blocks: [
          {
            type: 'text',
            heading: 'Testing AI Systems Before Release',
            content: `
Automated testing helps identify problems before AI application changes reach production.

Traditional software tests remain important.

These include unit tests, integration tests, API tests, security tests, and performance tests.

AI systems also require tests that examine model behavior and output quality.

Regression testing compares current behavior against previously established expectations.

For an LLM application, regression tests may verify:

- Required output fields.
- Response formatting.
- Expected instruction following.
- Retrieval behavior.
- Safety constraints.
- Response latency.
- Token consumption.

For a traditional machine learning model, regression tests may compare evaluation metrics against an approved baseline.

A model update should not be accepted simply because its new metrics appear reasonable.

Teams should investigate unexpected performance changes and assess whether the new model still satisfies business requirements.

Automated evaluation pipelines can run these tests whenever prompts, models, datasets, or application code change.

Testing helps make AI releases more predictable and reduces the risk of introducing regressions.
            `,
          },
          {
            type: 'check',
            question: 'What is the primary purpose of regression testing in an AI application?',
            options: [
              'To measure how the AI system performs under heavy load',
              'To check that newly added features work as specified',
              'To confirm changes have not made behavior or quality worse',
              'To find security weaknesses before attackers find them',
            ],
            answer: 2,
            explanation:
              'Regression testing identifies whether new changes have negatively affected previously acceptable system behavior.',
          },
        ],
      },

      {
        id: 'ai-quality-gates-and-human-evaluation',
        title: 'AI Quality Gates and Human Evaluation',
        minutes: 5,
        blocks: [
          {
            type: 'text',
            heading: 'Establishing AI Release Quality Gates',
            content: `
Quality gates are predefined conditions that must be satisfied before an AI component can progress through a release process.

A quality gate may evaluate:

- Model performance thresholds.
- Data quality requirements.
- Security test results.
- Bias and fairness considerations.
- Response quality.
- Latency requirements.
- Resource consumption.
- Compliance approvals.

For example, an organization may require a classification model to achieve a minimum recall score before production approval.

An LLM application may require acceptable results across a predefined evaluation dataset and safety test suite.

Human evaluation remains valuable when correctness, relevance, tone, fairness, or contextual judgment cannot be reliably assessed through automated metrics alone.

Human reviewers should use documented evaluation criteria and consistent scoring procedures.

Quality gates can combine automated test results with required human approvals.

Architects should define which conditions block deployment and which issues require investigation or exception approval.

These controls make AI release processes more predictable and accountable.
            `,
          },
          {
            type: 'check',
            question: 'What is the purpose of a quality gate in an AI release pipeline?',
            options: [
              'To enforce defined requirements before a release can move on',
              'To collect user feedback on responses after release',
              'To rank candidate models by their benchmark scores',
              'To route difficult requests to a human reviewer in production',
            ],
            answer: 0,
            explanation:
              'Quality gates prevent models or applications from progressing when they do not satisfy required performance, security, quality, or governance criteria.',
          },
        ],
      },
    ],
  },

  // SECTION 4 WILL CONTINUE HERE.
    // MODULE 10: PRODUCTION MONITORING AND MODEL GOVERNANCE
  {
    id: 'production-monitoring-model-governance',
    title: 'Production Monitoring and Model Governance',
    lessons: [
      {
        id: 'model-drift-data-drift-performance-monitoring',
        title: 'Model Drift, Data Drift, and Performance Monitoring',
        minutes: 5,
        blocks: [
          {
            type: 'text',
            heading: 'Understanding Model Drift and Data Drift',
            content: `Production machine learning models operate in changing environments. The data used during training may eventually differ from the data encountered in production.

Data drift occurs when the statistical characteristics of incoming data change over time. For example, a financial institution may train a fraud detection model using historical transaction patterns, but customer behavior and fraud techniques may change.

Model drift refers to a decline in model performance as relationships between input variables and target outcomes change. Concept drift is a related concept describing changes in the relationship between input features and the prediction target.

Production monitoring should track:
- Input data distributions and schema changes.
- Prediction distributions and confidence scores.
- Model accuracy and other performance metrics when actual outcomes become available.
- Data quality, missing values, and unusual inputs.
- Prediction latency, throughput, and error rates.

Monitoring thresholds should reflect business impact. A small accuracy decline in a low-risk recommendation model may require a different response from a decline in a credit risk or fraud detection model.

A production monitoring strategy should define alert thresholds, investigation procedures, retraining criteria, and escalation responsibilities.`
          },
          {
            type: 'check',
            question: 'What does data drift describe in a production machine learning system?',
            options: [
              'Changes in the statistical characteristics of incoming data',
              'Changes in the relationship between inputs and the correct outputs',
              'A gradual increase in prediction latency over time',
              'Differences between training and serving feature calculations',
            ],
            answer: 0,
            explanation: 'Data drift occurs when production input data changes relative to the data distribution used during model development or training.'
          }
        ]
      },
      {
        id: 'production-observability-incident-response',
        title: 'Production Observability and Incident Response',
        minutes: 5,
        blocks: [
          {
            type: 'text',
            heading: 'Operating AI Systems in Production',
            content: `Production AI systems require observability beyond simply checking whether a model endpoint is available.

Observability provides the information needed to understand system behavior and diagnose problems. It commonly combines metrics, logs, and traces.

Important operational metrics include:
- Request volume and throughput.
- Prediction latency and timeout rates.
- Model endpoint availability.
- Infrastructure utilization.
- Inference cost and resource consumption.
- Failed requests and application errors.
- Model-specific quality and performance indicators.

Logs should capture relevant operational events without exposing sensitive information. Distributed tracing can help identify bottlenecks across applications, model-serving infrastructure, APIs, and downstream services.

An AI incident response process should establish:
1. Detection through monitoring and alerts.
2. Classification based on severity and business impact.
3. Investigation of model, data, infrastructure, or application failures.
4. Mitigation through rollback, fallback models, traffic restrictions, or service recovery.
5. Root-cause analysis and corrective actions.

A mature organization maintains runbooks, ownership assignments, escalation procedures, and recovery objectives for production AI services.`
          },
          {
            type: 'check',
            question: 'Which three categories are commonly combined to support system observability?',
            options: [
              'Metrics, logs and traces',
              'Alerts, dashboards and runbooks',
              'Uptime, latency and error budgets',
              'Events, incidents and postmortems',
            ],
            answer: 0,
            explanation: 'Metrics, logs, and traces provide complementary information for understanding and troubleshooting production system behavior.'
          }
        ]
      },
      {
        id: 'ai-governance-risk-compliance',
        title: 'AI Governance, Risk, and Compliance',
        minutes: 5,
        blocks: [
          {
            type: 'text',
            heading: 'Governance Across the AI Lifecycle',
            content: `AI governance establishes the policies, controls, accountability, and oversight required to develop and operate AI systems responsibly.

Governance must cover the entire AI lifecycle, including data collection, model development, testing, deployment, monitoring, and retirement.

Important governance practices include:
- Model documentation and technical documentation.
- Data lineage and data provenance.
- Model ownership and approval responsibilities.
- Access control and separation of duties.
- Bias assessment and fairness testing.
- Explainability and transparency where appropriate.
- Security and privacy controls.
- Model versioning and change management.
- Audit trails and approval records.

Risk management should consider the impact of incorrect predictions, data exposure, model manipulation, bias, service outages, and unauthorized model changes.

Organizations should establish risk classifications and approval requirements that reflect the intended use and potential impact of each AI system.

Compliance requirements depend on the organization's industry, geography, data, and intended AI use. Governance processes should therefore involve security, legal, privacy, compliance, business, and technical stakeholders.

An effective governance program makes AI systems traceable, reviewable, accountable, and manageable throughout their operational lifecycle.`
          },
          {
            type: 'check',
            question: 'What is the primary purpose of AI governance?',
            options: [
              'To set accountability, oversight and controls for AI use',
              'To make sure models meet accuracy targets before release',
              'To document model architectures for engineering teams',
              'To keep AI infrastructure and model costs within budget',
            ],
            answer: 0,
            explanation: 'AI governance establishes the policies, accountability, and controls needed to manage AI risks and responsibilities throughout the lifecycle.'
          }
        ]
      }
    ]
  },

  // MODULE 11: MLOPS AND LLMOPS ARCHITECTURE CAPSTONE
  {
    id: 'mlops-llmops-architecture-capstone',
    title: 'MLOps and LLMOps Architecture Capstone',
    lessons: [
      {
        id: 'define-production-ai-requirements-operating-model',
        title: 'Define Production AI Requirements and Operating Model',
        minutes: 5,
        blocks: [
          {
            type: 'text',
            heading: 'Establishing the Production AI Requirements',
            content: `Before designing an MLOps or LLMOps architecture, an architect must understand the business problem, operational requirements, and constraints.

The requirements should identify:
- Business objectives and expected outcomes.
- AI use cases and intended users.
- Data sources, ownership, quality, and sensitivity.
- Model types and deployment requirements.
- Expected request volume and workload characteristics.
- Latency, availability, and scalability targets.
- Security, privacy, and regulatory requirements.
- Budget and infrastructure constraints.
- Monitoring, support, and incident response expectations.

The operating model defines how teams collaborate to build and operate AI systems.

Typical responsibilities include:
- Data engineers managing ingestion and data pipelines.
- Data scientists developing and evaluating models.
- ML engineers building training and deployment pipelines.
- Platform engineers managing shared infrastructure.
- AI architects defining technical standards and integration patterns.
- Security and governance teams overseeing risk and compliance.
- Business owners defining objectives and accepting operational outcomes.

The architect should also define ownership boundaries, approval processes, service-level objectives, and lifecycle responsibilities.

A clear operating model prevents gaps between model development and production operations.`
          },
          {
            type: 'check',
            question: 'Why should an architect define an AI operating model before implementation?',
            options: [
              "To choose the cloud provider and model hosting platform",
              "To estimate the infrastructure budget for the first year",
              "To select the evaluation metrics for each model",
              "To set responsibilities, ownership and processes",
            ],
            answer: 3,
            explanation: 'An operating model establishes who owns each activity and how teams collaborate throughout the AI lifecycle.'
          }
        ]
      },
      {
        id: 'design-end-to-end-mlops-llmops-architecture',
        title: 'Design End-to-End MLOps and LLMOps Architecture',
        minutes: 5,
        blocks: [
          {
            type: 'text',
            heading: 'Putting the Architecture Together',
            content: `An enterprise MLOps and LLMOps architecture connects data engineering, model development, deployment, monitoring, and governance into a controlled operational environment.

A typical architecture contains the following layers:

1. Data layer:
   Ingests, validates, transforms, and versions structured and unstructured data.

2. Feature and knowledge layer:
   Manages reusable machine learning features, embeddings, vector indexes, and retrieval knowledge sources.

3. Development and experimentation layer:
   Supports notebooks, development environments, training workflows, prompt development, and experimentation.

4. Model and artifact management layer:
   Stores model artifacts, model metadata, prompt versions, evaluation results, and lineage information.

5. Pipeline orchestration layer:
   Coordinates training, testing, validation, approval, deployment, and retraining workflows.

6. Deployment and inference layer:
   Hosts model endpoints, LLM applications, APIs, and retrieval-augmented generation services.

7. Evaluation and monitoring layer:
   Measures model quality, LLM response quality, latency, cost, reliability, and drift.

8. Security and governance layer:
   Applies identity management, authorization, encryption, audit logging, risk controls, and approval policies.

For traditional machine learning, the architecture may emphasize feature pipelines, training, model registries, and inference endpoints.

For LLM applications, it may additionally include foundation model providers, prompt management, embedding models, vector databases, retrieval pipelines, guardrails, and LLM evaluation.

The architecture should integrate these capabilities while maintaining consistent security, observability, governance, and operational standards.`
          },
          {
            type: 'check',
            question: 'Which capability is particularly important in an LLMOps architecture that implements retrieval-augmented generation?',
            options: [
              'Distributed training across GPU clusters',
              'Embedding generation and vector-based retrieval',
              'Feature stores for tabular model inputs',
              'Hyperparameter search across candidate models',
            ],
            answer: 1,
            explanation: 'RAG architectures use embeddings and retrieval systems to find relevant information from external knowledge sources before generating responses.'
          }
        ]
      },
      {
        id: 'architecture-review-operational-readiness',
        title: 'Architecture Review and Operational Readiness',
        minutes: 5,
        blocks: [
          {
            type: 'text',
            heading: 'Validating Production Readiness',
            content: `A production AI architecture should be reviewed before it is approved for operational use.

The architecture review should evaluate:
- Business alignment and technical requirements.
- Data quality, lineage, and access controls.
- Model reproducibility and version management.
- Pipeline automation and release controls.
- Model and LLM evaluation procedures.
- Deployment scalability and availability.
- Monitoring, alerting, and incident response.
- Security, privacy, and regulatory controls.
- Cost management and resource utilization.
- Backup, recovery, and rollback procedures.

Operational readiness requires more than a successful deployment. Teams must demonstrate that the system can be supported, monitored, secured, and improved over time.

A production readiness checklist should identify outstanding risks, responsible owners, required approvals, and remediation deadlines.

The final architecture deliverable should include:
1. Business and technical requirements.
2. Architecture diagrams and component descriptions.
3. Data and model lifecycle workflows.
4. CI/CD and deployment strategy.
5. Monitoring and incident response design.
6. Security and governance controls.
7. Cost and scalability considerations.
8. Operational ownership and support procedures.

The architect's responsibility is to ensure that the proposed platform is not only technically functional but also sustainable, secure, governed, and aligned with enterprise objectives.`
          },
          {
            type: 'check',
            question: 'What is the primary objective of an AI production readiness review?',
            options: [
              "To confirm the model meets its accuracy target on the test set",
              "To check that the team has finished every planned feature",
              "To approve the budget for production infrastructure",
              "To verify it can be operated, monitored and supported safely",
            ],
            answer: 3,
            explanation: 'Production readiness validates the complete operational capability of the AI solution, not just whether the initial deployment works.'
          }
        ]
      }
    ]
  },

  

];
// ============================================================
// COURSE METADATA AND LEARNING OUTCOMES
// ============================================================

const OUTCOMES = [
  'Explain the MLOps and LLMOps lifecycle and their enterprise applications.',
  'Design reproducible machine learning training and experimentation pipelines.',
  'Implement data validation, feature engineering, and pipeline orchestration.',
  'Manage model versions, registries, approvals, and artifact lineage.',
  'Design CI/CD and continuous training workflows for machine learning.',
  'Evaluate model deployment and inference-serving architectures.',
  'Manage foundation models, prompts, embeddings, and RAG pipelines.',
  'Implement AI evaluation, testing, and quality assurance processes.',
  'Monitor production AI systems for drift, reliability, and performance.',
  'Apply AI governance, security, risk management, and operational controls.',
  'Design an enterprise-ready MLOps and LLMOps architecture.',
];

const SKILLS = [
  'MLOps',
  'LLMOps',
  'Machine Learning Lifecycle Management',
  'Experiment Tracking',
  'Feature Engineering',
  'Data Pipeline Engineering',
  'Model Training',
  'Model Registry',
  'Model Versioning',
  'CI/CD',
  'Continuous Training',
  'Model Deployment',
  'Inference Optimization',
  'Prompt Management',
  'Retrieval-Augmented Generation',
  'LLM Evaluation',
  'Model Monitoring',
  'AI Observability',
  'AI Governance',
  'Production AI Architecture',
];

// ============================================================
// BUILD COURSE MODULE OUTLINES
// ============================================================

const COURSE_MODULES = MODULES.map((module, moduleIndex) => ({
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
}));

// ============================================================
// NORMALIZE LESSON BLOCKS
// ============================================================

function normalizeBlocks(blocks) {
  return blocks.map(block => {
    if (block.type === 'text') {
      // "# Heading" renders as a heading in lessons; trim the template-literal
      // indentation and blank lines around the content.
      return {
        type: 'text',
        text: [
          block.heading ? `# ${block.heading.trim()}` : null,
          (block.content ?? '')
            .split('\n')
            .map(line => line.trimEnd())
            .join('\n')
            .trim(),
        ].filter(Boolean).join('\n\n'),
      };
    }

    return block;
  });
}

// ============================================================
// BUILD LESSON DOCUMENTS
// ============================================================

const LESSON_DOCUMENTS = [];

let globalLessonOrder = 0;

MODULES.forEach((module, moduleIndex) => {
  module.lessons.forEach(lesson => {
    globalLessonOrder++;

    LESSON_DOCUMENTS.push({
      id: lesson.id,
      courseId: COURSE.id,
      moduleId: module.id,
      moduleTitle: module.title,
      moduleOrder: moduleIndex + 1,
      order: globalLessonOrder,
      title: lesson.title,
      minutes: lesson.minutes,
      blocks: normalizeBlocks(lesson.blocks),
      status: 'draft',
    });
  });
});

// ============================================================
// VALIDATE COURSE CONTENT
// ============================================================

function validateCourse() {
  const errors = [];

  if (MODULES.length !== 11) {
    errors.push(`Expected 11 modules; found ${MODULES.length}.`);
  }

  if (LESSON_DOCUMENTS.length !== 33) {
    errors.push(`Expected 33 lessons; found ${LESSON_DOCUMENTS.length}.`);
  }

  if (OUTCOMES.length === 0) {
    errors.push('Course outcomes are missing.');
  }

  if (SKILLS.length === 0) {
    errors.push('Course skills are missing.');
  }

  const moduleIds = new Set();
  const lessonIds = new Set();

  for (const module of MODULES) {
    if (!module.id || !module.title) {
      errors.push('A module is missing its ID or title.');
    }

    if (moduleIds.has(module.id)) {
      errors.push(`Duplicate module ID: ${module.id}`);
    }

    moduleIds.add(module.id);

    if (!module.lessons.length) {
      errors.push(`Module "${module.title}" has no lessons.`);
    }

    for (const lesson of module.lessons) {
      if (!lesson.id || !lesson.title) {
        errors.push(`A lesson in "${module.title}" is missing its ID or title.`);
      }

      if (lessonIds.has(lesson.id)) {
        errors.push(`Duplicate lesson ID: ${lesson.id}`);
      }

      lessonIds.add(lesson.id);

      if (!Number.isFinite(lesson.minutes) || lesson.minutes <= 0) {
        errors.push(`Invalid duration for lesson: ${lesson.id}`);
      }

      const textBlocks = lesson.blocks.filter(
        block => block.type === 'text'
      );

      const checkBlocks = lesson.blocks.filter(
        block => block.type === 'check'
      );

      if (textBlocks.length === 0) {
        errors.push(`Lesson "${lesson.id}" has no text content.`);
      }

      if (checkBlocks.length === 0) {
        errors.push(`Lesson "${lesson.id}" has no Quick Check.`);
      }

      for (const check of checkBlocks) {
        if (
          !check.question ||
          !Array.isArray(check.options) ||
          check.options.length < 2 ||
          !Number.isInteger(check.answer) ||
          check.answer < 0 ||
          check.answer >= check.options.length
        ) {
          errors.push(`Invalid Quick Check in lesson: ${lesson.id}`);
        }
      }
    }
  }

  if (errors.length) {
    console.error('\nCOURSE VALIDATION FAILED:\n');

    errors.forEach(error => console.error(`- ${error}`));

    throw new Error(
      `Course validation failed with ${errors.length} error(s).`
    );
  }

  console.log('\nCOURSE VALIDATION PASSED');
  console.log(`Modules: ${MODULES.length}`);
  console.log(`Lessons: ${LESSON_DOCUMENTS.length}`);

  const quickCheckCount = LESSON_DOCUMENTS.reduce(
    (total, lesson) =>
      total + lesson.blocks.filter(block => block.type === 'check').length,
    0
  );

  console.log(`Quick Checks: ${quickCheckCount}`);
  console.log(
    `Estimated duration: ${
      LESSON_DOCUMENTS.reduce((total, lesson) => total + lesson.minutes, 0)
    } minutes`
  );
}
// ============================================================
// FIRESTORE SEED OPERATIONS
// ============================================================

async function seedCourse() {
  validateCourse();

  const courseRef = db.collection('courses').doc(COURSE.id);

  const existingCourse = await courseRef.get();

  if (existingCourse.exists && !OVERWRITE) {
    throw new Error(
      `Course "${COURSE.id}" already exists. Use --overwrite to update it.`
    );
  }

  const existingLessonSnapshot = await courseRef
    .collection('lessons')
    .get();

  const existingLessonIds = new Set(
    existingLessonSnapshot.docs.map(doc => doc.id)
  );

  const newLessonIds = new Set(
    LESSON_DOCUMENTS.map(lesson => lesson.id)
  );

  const staleLessonIds = [...existingLessonIds].filter(
    id => !newLessonIds.has(id)
  );

  const estimatedMinutes = LESSON_DOCUMENTS.reduce(
    (total, lesson) => total + lesson.minutes,
    0
  );

  // Only fields the course rules allow (firestore.rules isValidCourse).
  // subtitle, language, category and tags are kept in COURSE for this
  // script but are not written to Firestore.
  const {
    subtitle: _subtitle,
    language: _language,
    category: _category,
    tags: _tags,
    ...courseFields
  } = COURSE;

  const courseData = {
    ...courseFields,

    organizationId: null,
    summary: COURSE.subtitle,
    topic: COURSE.category,

    outcomes: OUTCOMES,
    skills: SKILLS,

    modules: COURSE_MODULES,

    lessonCount: LESSON_DOCUMENTS.length,
    estimatedMinutes,

    finalExam: null,

    authorName: 'Zebron',
    providerName: 'Zebron',

    publishedAt: null,
    review: null,

    status: 'draft',

    updatedAt: FieldValue.serverTimestamp(),
  };

  if (!existingCourse.exists) {
    courseData.createdAt = FieldValue.serverTimestamp();
  }

  console.log('\n========================================');
  console.log('MLOps AND LLMOps COURSE SEED');
  console.log('========================================');

  console.log(`Project: ${PROJECT_ID}`);
  console.log(`Course: ${COURSE.title}`);
  console.log(`Course ID: ${COURSE.id}`);
  console.log(`Modules: ${MODULES.length}`);
  console.log(`Lessons: ${LESSON_DOCUMENTS.length}`);
  console.log(`Estimated duration: ${estimatedMinutes} minutes`);
  console.log(`Existing lessons: ${existingLessonIds.size}`);
  console.log(`Stale lessons to remove: ${staleLessonIds.length}`);
  console.log(`Overwrite: ${OVERWRITE}`);
  console.log(`Apply: ${APPLY}`);

  if (!APPLY) {
    console.log('\nDRY RUN ONLY — NO FIRESTORE DATA WAS CHANGED.');

    console.log('\nModule breakdown:');

    MODULES.forEach((module, index) => {
      console.log(
        `${index + 1}. ${module.title} (${module.lessons.length} lessons)`
      );
    });

    console.log('\nTo write this course to Firebase, run:');
    console.log(
      `node scripts/mlops-llmops-production-ai-operations/seed-mlops-llmops-production-ai-operations.mjs --apply`
    );

    if (existingCourse.exists) {
      console.log('\nTo update an existing course, run:');
      console.log(
        `node scripts/mlops-llmops-production-ai-operations/seed-mlops-llmops-production-ai-operations.mjs --apply --overwrite`
      );
    }

    return;
  }

  const batch = db.batch();

  batch.set(courseRef, courseData, { merge: true });

  for (const lesson of LESSON_DOCUMENTS) {
    const lessonRef = courseRef
      .collection('lessons')
      .doc(lesson.id);

    batch.set(
      lessonRef,
      {
        // Only fields the lesson rules allow (isValidCourseLesson).
        title: lesson.title,
        moduleId: lesson.moduleId,
        order: lesson.order,
        minutes: lesson.minutes,
        blocks: lesson.blocks,
        updatedAt: FieldValue.serverTimestamp(),
      }
    );
  }

  for (const staleLessonId of staleLessonIds) {
    const staleLessonRef = courseRef
      .collection('lessons')
      .doc(staleLessonId);

    batch.delete(staleLessonRef);
  }

  await batch.commit();

  console.log('\n========================================');
  console.log('COURSE SEED COMPLETED');
  console.log('========================================');

  console.log(`Course written: ${COURSE.id}`);
  console.log(`Lessons written: ${LESSON_DOCUMENTS.length}`);
  console.log(`Stale lessons deleted: ${staleLessonIds.length}`);
  console.log('Course status: draft');
}

seedCourse()
  .then(() => {
    console.log('\nSeed script finished.');
    process.exit(0);
  })
  .catch(error => {
    console.error('\nSEED SCRIPT FAILED:');
    console.error(error);
    process.exit(1);
  });


