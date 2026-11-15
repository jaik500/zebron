// ================================================
// AI ENGINEERING FUNDAMENTALS & LLMs
// SECTION 1 OF 3
// ================================================

import {
  applicationDefault,
  initializeApp,
} from "firebase-admin/app";

import {
  FieldValue,
  getFirestore,
} from "firebase-admin/firestore";

const PROJECT_ID =
  process.env.GCLOUD_PROJECT || "zebron-2b49f";

initializeApp({
  credential: applicationDefault(),
  projectId: PROJECT_ID,
});

const db = getFirestore();

const COURSE_ID = "ai-engineering-fundamentals-llms";

const args = process.argv.slice(2);

const APPLY = args.includes("--apply");
const OVERWRITE = args.includes("--overwrite");

// ================================================
// CONTENT HELPERS
// ================================================

const text = (value) => ({
  type: "text",
  text: value.trim(),
});

const check = (
  question,
  options,
  answer,
  explanation
) => ({
  type: "check",
  question,
  options,
  answer,
  explanation,
});

const lesson = (
  id,
  title,
  minutes,
  content,
  question,
  options,
  answer,
  explanation
) => ({
  id,
  title,
  minutes,
  blocks: [
    text(content),
    check(question, options, answer, explanation),
  ],
});

const moduleData = (id, title, lessons) => ({
  id,
  title,
  lessons,
});

// ================================================
// COURSE MODULES
// ================================================

const MODULES = [];

// ================================================
// MODULE 1 — INTRODUCTION TO ARTIFICIAL INTELLIGENCE
// ================================================

MODULES.push(
  moduleData(
    "introduction-to-artificial-intelligence",
    "Introduction to Artificial Intelligence",
    [
      lesson(
        "understanding-artificial-intelligence",
        "Understanding Artificial Intelligence",
        14,
        `
Artificial Intelligence (AI) is a field of computer
science focused on creating systems that perform tasks
normally associated with human intelligence.

These tasks may include:

- Understanding language.
- Recognizing images.
- Identifying patterns.
- Making predictions.
- Generating content.
- Supporting decisions.
- Solving complex problems.

AI systems use different techniques depending
on the problem they are designed to solve.

Examples include:

Image Recognition:
Identifying objects in photographs.

Natural Language Processing:
Understanding and generating human language.

Recommendation Systems:
Suggesting products, courses, or content.

Fraud Detection:
Identifying potentially suspicious transactions.

Generative AI:
Creating text, images, audio, and other content.

AI is not a single technology.

It is a broad field containing multiple approaches,
algorithms, models, and engineering disciplines.

An AI engineer must understand both the capabilities
and limitations of the systems being developed.
        `,
        "What is the primary objective of artificial intelligence?",
        [
          "To create systems capable of performing tasks associated with intelligence",
          "To replace every database",
          "To eliminate all software development",
          "To make every computer operate without electricity"
        ],
        0,
        "AI focuses on building systems that perform tasks commonly associated with human intelligence."
      ),

      lesson(
        "types-of-artificial-intelligence",
        "Types and Categories of Artificial Intelligence",
        15,
        `
AI can be classified in several ways.

One common conceptual classification describes
three levels of capability.

Narrow AI:

Systems designed to perform specific tasks.

Examples include:

- Image classification.
- Voice assistants.
- Fraud detection.
- Recommendation systems.
- Language models.

Artificial General Intelligence (AGI):

A theoretical form of AI that could perform
a broad range of intellectual tasks across domains
with general capability.

Artificial Superintelligence (ASI):

A hypothetical form of AI that would substantially
exceed human capabilities across many intellectual areas.

Today's widely deployed AI systems are generally
considered specialized or narrow AI.

Another classification focuses on functionality:

Reactive Systems:
Respond to current inputs without maintaining
a persistent model of past experiences.

Limited-Memory Systems:
Use information from previous observations
or stored context to support decisions.

These classifications help distinguish current
AI capabilities from theoretical future systems.
        `,
        "Which category best describes an AI system designed to perform a specific task such as image classification?",
        [
          "Artificial General Intelligence",
          "Artificial Narrow Intelligence",
          "Artificial Superintelligence",
          "Human-level universal intelligence"
        ],
        1,
        "Artificial Narrow Intelligence refers to systems designed for specific tasks or limited domains."
      ),

      lesson(
        "ai-ml-dl-generative-ai",
        "Understanding AI, Machine Learning, Deep Learning, and Generative AI",
        16,
        `
Artificial Intelligence is the broad field.

Machine Learning (ML) is a subset of AI in which
systems learn patterns from data to make predictions
or decisions.

Deep Learning (DL) is a subset of machine learning
that uses neural networks with multiple layers.

Generative AI is a category of AI systems designed
to generate new content.

Examples include:

- Text generation.
- Image generation.
- Audio generation.
- Video generation.
- Code generation.

The relationship can be understood as:

Artificial Intelligence
    |
    v
Machine Learning
    |
    v
Deep Learning

Generative AI overlaps with these areas and often
uses deep learning models.

Large Language Models are a major category
of generative AI focused on language tasks.

Understanding these relationships is important
when evaluating AI solutions and selecting
the right technology for a business problem.
        `,
        "Which statement correctly describes the relationship between machine learning and AI?",
        [
          "Machine learning is a subset of AI",
          "AI is a subset of machine learning",
          "They are completely unrelated",
          "Machine learning only applies to databases"
        ],
        0,
        "Machine learning is one approach within the broader field of artificial intelligence."
      ),
    ]
  )
);

// ================================================
// MODULE 2 — UNDERSTANDING MACHINE LEARNING
// ================================================

MODULES.push(
  moduleData(
    "understanding-machine-learning",
    "Understanding Machine Learning",
    [
      lesson(
        "machine-learning-fundamentals",
        "Machine Learning Fundamentals",
        15,
        `
Machine Learning enables systems to learn patterns
from data instead of relying exclusively on
explicitly programmed rules.

A machine learning model is trained using data.

During training, the model adjusts its internal
parameters to learn relationships within the data.

After training, the model can make predictions
or decisions using new inputs.

Example:

A bank wants to identify potentially fraudulent
transactions.

It provides historical transaction data,
including examples of fraudulent and legitimate
transactions.

A machine learning model learns patterns
associated with fraud.

When a new transaction arrives, the model
can estimate whether it appears suspicious.

Important concepts include:

Dataset:
The collection of information used in training
and evaluating a model.

Features:
Input variables used by the model.

Labels:
Expected outputs in supervised learning.

Training:
The process of learning patterns from data.

Inference:
Using a trained model to generate predictions.

Machine learning is used in finance, healthcare,
manufacturing, cybersecurity, and many other industries.
        `,
        "What is inference in machine learning?",
        [
          "The process of training a model from scratch",
          "Using a trained model to generate predictions",
          "Deleting the training dataset",
          "Writing an application user interface"
        ],
        1,
        "Inference is the process of using a trained model to produce predictions or outputs."
      ),

      lesson(
        "supervised-unsupervised-learning",
        "Supervised and Unsupervised Learning",
        16,
        `
Machine learning approaches differ based on
how training data is organized.

Supervised Learning:

The model learns from labeled examples.

Each training example includes inputs
and an expected output.

Example:

An email classification model learns from emails
labeled as spam or legitimate.

Common supervised learning tasks include:

Classification:
Predicting a category.

Regression:
Predicting a numerical value.

Unsupervised Learning:

The model works with data that does not contain
explicit target labels.

It attempts to discover patterns or structure.

Example:

A retailer groups customers based on purchasing
behavior without predefined customer categories.

Common unsupervised learning tasks include:

Clustering:
Grouping similar observations.

Dimensionality Reduction:
Reducing the number of variables while preserving
important information.

The choice depends on the business problem
and the available data.
        `,
        "Which learning approach uses labeled examples during training?",
        [
          "Unsupervised learning",
          "Supervised learning",
          "Reinforcement learning",
          "Random processing"
        ],
        1,
        "Supervised learning trains models using examples that include expected outputs or labels."
      ),

      lesson(
        "reinforcement-learning",
        "Introduction to Reinforcement Learning",
        15,
        `
Reinforcement Learning (RL) is a machine learning
approach in which an agent learns through interaction
with an environment.

The agent takes actions and receives feedback
in the form of rewards or penalties.

Important concepts include:

Agent:
The learner or decision-making system.

Environment:
The system or world in which the agent operates.

State:
The current situation observed by the agent.

Action:
A decision made by the agent.

Reward:
Feedback indicating the value of an action.

Policy:
A strategy used by the agent to choose actions.

Example:

A robot learns to navigate a warehouse.

It receives positive rewards for reaching
the correct destination and penalties
for collisions or inefficient movement.

Over time, it learns a policy that improves
its behavior.

Reinforcement learning is used in areas such as:

- Robotics.
- Game-playing systems.
- Resource optimization.
- Control systems.

Reinforcement learning differs from supervised
learning because it learns through interaction
and reward feedback rather than relying exclusively
on labeled input-output examples.
        `,
        "What provides feedback to an agent in reinforcement learning?",
        [
          "Rewards and penalties",
          "HTML templates",
          "Database table names",
          "API documentation"
        ],
        0,
        "An agent receives rewards or penalties from its environment to guide learning."
      ),
    ]
  )
);

// ================================================
// MODULE 3 — DEEP LEARNING FUNDAMENTALS
// ================================================

MODULES.push(
  moduleData(
    "deep-learning-fundamentals",
    "Deep Learning Fundamentals",
    [
      lesson(
        "understanding-deep-learning",
        "Understanding Deep Learning",
        16,
        `
Deep Learning is a subset of machine learning
that uses neural networks containing multiple
computational layers.

These networks can learn complex patterns
from large amounts of data.

Deep learning is particularly useful for:

- Image recognition.
- Speech recognition.
- Natural language processing.
- Computer vision.
- Generative AI.

Traditional machine learning may require
engineers to manually identify useful features.

Deep learning models can learn many features
automatically from training data.

However, deep learning often requires:

- Large datasets.
- Significant computational resources.
- Model training time.
- Careful evaluation.
- Appropriate infrastructure.

Graphics Processing Units (GPUs) are frequently
used to accelerate deep learning computations.

Deep learning has contributed significantly
to modern language models, image generators,
and other advanced AI systems.
        `,
        "What distinguishes deep learning from many traditional machine learning approaches?",
        [
          "It uses neural networks with multiple computational layers",
          "It never requires training data",
          "It only works with spreadsheets",
          "It cannot process images"
        ],
        0,
        "Deep learning uses multi-layer neural networks to learn complex patterns from data."
      ),

      lesson(
        "training-neural-networks",
        "How Neural Networks Learn",
        17,
        `
A neural network learns by adjusting its internal
parameters to reduce prediction errors.

The learning process commonly involves:

1. Forward Pass:

Input data moves through the network
to generate a prediction.

2. Loss Calculation:

A loss function measures how different
the prediction is from the expected result.

3. Backpropagation:

The network calculates gradients that indicate
how its parameters contributed to the error.

4. Optimization:

An optimizer updates model parameters
to reduce the loss.

This process repeats over many training examples.

Important concepts include:

Weights:
Parameters that influence connections
between neurons.

Biases:
Additional parameters that adjust neuron outputs.

Loss Function:
A mathematical measure of prediction error.

Learning Rate:
A parameter controlling the size of updates
during optimization.

Epoch:
One complete pass through the training dataset.

Training quality depends on data quality,
model design, optimization, and evaluation.
        `,
        "What is the primary purpose of backpropagation?",
        [
          "To calculate gradients used to update network parameters",
          "To delete training data",
          "To convert Python into JavaScript",
          "To publish an API"
        ],
        0,
        "Backpropagation calculates gradients that help an optimizer update neural network parameters."
      ),

      lesson(
        "deep-learning-use-cases",
        "Deep Learning Applications and Use Cases",
        15,
        `
Deep learning powers many modern AI applications.

Computer Vision:

Analyzes images and video.

Examples:

- Object detection.
- Facial image analysis.
- Medical image classification.
- Manufacturing defect detection.

Natural Language Processing:

Processes human language.

Examples:

- Translation.
- Text classification.
- Sentiment analysis.
- Language generation.

Speech and Audio:

Processes spoken language and sound.

Examples:

- Speech recognition.
- Voice generation.
- Audio classification.

Recommendation Systems:

Identify patterns in user behavior
to recommend relevant content or products.

Generative AI:

Creates new content based on learned patterns.

Examples include text, images, audio, and code.

Enterprise architects should evaluate whether
deep learning is appropriate for a business problem.

Some tasks may be better served by traditional
machine learning, deterministic software,
or rule-based automation.
        `,
        "Which is an example of a computer vision application?",
        [
          "Detecting defects in manufacturing images",
          "Approving a database transaction",
          "Creating an HTTP header",
          "Managing a network password"
        ],
        0,
        "Computer vision systems analyze visual information, including images and video."
      ),
    ]
  )
);

// ================================================
// MODULE 4 — NEURAL NETWORKS AND TRANSFORMERS
// ================================================

MODULES.push(
  moduleData(
    "neural-networks-transformers",
    "Neural Networks and Transformers",
    [
      lesson(
        "neural-network-architecture",
        "Neural Network Architecture",
        16,
        `
A neural network is a computational model
inspired by simplified concepts of biological neurons.

A basic neural network contains:

Input Layer:
Receives the input data.

Hidden Layers:
Transform information through learned operations.

Output Layer:
Produces the model's prediction or result.

Each neuron receives values, applies weights
and biases, and uses an activation function.

Common activation functions include:

ReLU:
Often used in hidden layers.

Sigmoid:
Produces values between zero and one.

Tanh:
Produces values between negative one and one.

The number of layers, neurons, connections,
and other design choices contribute to
the network architecture.

Different architectures are suited to different tasks.

For example:

Convolutional Neural Networks (CNNs)
have historically been important in image processing.

Recurrent Neural Networks (RNNs)
were developed to process sequential information.

Transformers have become central to modern
language models and many other AI systems.
        `,
        "Which layer of a neural network receives the original input data?",
        [
          "Output layer",
          "Input layer",
          "Loss layer",
          "Optimization layer"
        ],
        1,
        "The input layer receives the data that enters the neural network."
      ),

      lesson(
        "attention-mechanism",
        "Understanding the Attention Mechanism",
        17,
        `
Attention is a mechanism that helps neural networks
determine which parts of an input are important
when processing information.

In language processing, the meaning of a word
can depend on other words in the same sentence.

Example:

"The bank approved the loan."

The word bank refers to a financial institution.

In another sentence:

"The boat reached the river bank."

The surrounding words provide different context.

Attention mechanisms allow models to calculate
relationships between elements in a sequence.

Transformers use attention to process relationships
between tokens.

Important concepts include:

Query:
Represents what information a position is seeking.

Key:
Represents information used to determine relevance.

Value:
Represents the information that can be combined.

Attention scores help determine how much
different positions contribute to the result.

Attention is a foundational concept for understanding
modern large language models.
        `,
        "What does an attention mechanism help a model determine?",
        [
          "Which parts of the input are relevant to processing a particular position",
          "How much storage a database requires",
          "Which HTTP status code to return",
          "How to compile a Python application"
        ],
        0,
        "Attention helps a model determine the relevance of different parts of its input."
      ),

      lesson(
        "transformer-architecture",
        "Understanding the Transformer Architecture",
        18,
        `
The Transformer is a neural network architecture
introduced in the research paper
"Attention Is All You Need" in 2017.

Transformers use attention mechanisms
to process relationships between tokens.

A traditional Transformer architecture contains
encoder and decoder components.

Encoder:

Processes input information into representations.

Decoder:

Uses representations and previously generated
tokens to produce output.

Modern language models use different Transformer
designs depending on their objectives.

Encoder-only models:
Often used for language understanding tasks.

Decoder-only models:
Commonly used for autoregressive text generation.

Encoder-decoder models:
Often used for sequence-to-sequence tasks.

Transformers support parallel processing
of input positions during training,
unlike many traditional recurrent architectures.

Their ability to model relationships across sequences
has made them important in modern AI systems.

Understanding Transformer architecture provides
the foundation for learning how large language models
are built and used.
        `,
        "Which architecture is foundational to many modern large language models?",
        [
          "Transformer",
          "Relational database",
          "Operating system kernel",
          "Binary search tree"
        ],
        0,
        "Transformer architectures underpin many modern large language models."
      ),
    ]
  )
);

// END OF SECTION 1
// ================================================
// MODULE 5 — LARGE LANGUAGE MODELS (LLMs)
// ================================================

MODULES.push(
  moduleData(
    "large-language-models",
    "Large Language Models (LLMs)",
    [
      lesson(
        "understanding-large-language-models",
        "Understanding Large Language Models",
        16,
        `
A Large Language Model (LLM) is an AI model trained
on large amounts of text and other data to process
and generate language.

LLMs can perform tasks such as:

- Answering questions.
- Summarizing documents.
- Generating code.
- Translating languages.
- Extracting information.
- Drafting business communications.
- Supporting conversational applications.

LLMs learn statistical patterns and relationships
from their training data.

They do not retrieve facts from a perfect database
of everything they have learned.

Their responses are generated using learned patterns
and the context provided during inference.

Examples of LLM families include:

- GPT models.
- Claude models.
- Gemini models.
- Llama models.
- Mistral models.

Organizations can access models through APIs,
host models themselves, or use managed AI platforms.

An AI engineer must evaluate models based on
capability, cost, latency, security, and business needs.
        `,
        "What is a primary capability of a large language model?",
        [
          "Generating and processing human language",
          "Replacing all enterprise databases",
          "Automatically guaranteeing factual accuracy",
          "Eliminating the need for software architecture"
        ],
        0,
        "LLMs process and generate language using patterns learned during training."
      ),

      lesson(
        "llm-training-lifecycle",
        "How Large Language Models Are Trained",
        17,
        `
Training a large language model involves several
stages and substantial computational resources.

Pretraining:

The model learns general patterns from large datasets.

During pretraining, the model commonly learns
to predict the next token in a sequence.

Supervised Fine-Tuning:

The model is trained using curated examples
of desired inputs and outputs.

This helps align the model's behavior
with specific instructions and tasks.

Preference Optimization:

Additional training can help the model produce
responses that better reflect human preferences.

Different models use different training methods.

Training infrastructure may include:

- GPUs and accelerators.
- Distributed computing.
- Large datasets.
- Model optimization techniques.
- Data quality controls.

Important distinction:

Training changes model parameters.

Inference uses an existing trained model
to generate outputs.

Most developers using commercial LLM APIs
perform inference rather than training
the underlying foundation model.
        `,
        "What happens during model inference?",
        [
          "A trained model is used to generate an output",
          "The entire model is trained from scratch",
          "All model parameters are deleted",
          "The training dataset is automatically replaced"
        ],
        0,
        "Inference uses an already trained model to process inputs and generate outputs."
      ),

      lesson(
        "foundation-models",
        "Foundation Models and Specialized Models",
        16,
        `
A foundation model is a model trained on broad data
that can support many downstream tasks.

Foundation models can be adapted through:

Prompting:
Providing instructions and context at inference time.

Fine-Tuning:
Updating model parameters using additional training data.

Retrieval-Augmented Generation:
Providing relevant external information
during inference.

Specialized Models:

Models designed or adapted for particular tasks.

Examples include:

- Code generation.
- Medical image analysis.
- Speech recognition.
- Document classification.
- Embedding generation.

Model selection depends on the use case.

Consider:

A company building a customer support assistant
may use a general-purpose language model.

A company processing specialized documents
may benefit from a model adapted for that domain.

A foundation model is not automatically
the best choice for every enterprise task.

Evaluate accuracy, privacy, cost, latency,
deployment requirements, and operational constraints.
        `,
        "What is a foundation model?",
        [
          "A broadly trained model that can support multiple downstream tasks",
          "A database table containing customer records",
          "A model that can only perform one fixed operation",
          "A replacement for an operating system"
        ],
        0,
        "Foundation models are broadly trained and can be adapted or prompted for many different tasks."
      ),
    ]
  )
);

// ================================================
// MODULE 6 — HOW LLMs GENERATE RESPONSES
// ================================================

MODULES.push(
  moduleData(
    "how-llms-generate-responses",
    "How LLMs Generate Responses",
    [
      lesson(
        "llm-inference-process",
        "Understanding the LLM Inference Process",
        16,
        `
Inference is the process through which a trained
language model generates an output.

A typical text-generation workflow is:

1. Receive the input prompt.
2. Convert text into tokens.
3. Convert tokens into model representations.
4. Process the input through the model.
5. Calculate possible next-token probabilities.
6. Select or sample the next token.
7. Repeat until generation stops.

Example prompt:

"What is artificial intelligence?"

The model processes the input and predicts
a likely sequence of response tokens.

The generated response is constructed
one token at a time.

Important concepts include:

Input Prompt:
The instructions and information provided to the model.

Tokenization:
Converting text into tokens.

Logits:
Raw numerical scores produced by the model
for possible next tokens.

Sampling:
Selecting the next token based on a probability distribution.

Decoding:
The process used to convert model outputs
into generated text.

Understanding inference helps engineers
design applications that use LLMs effectively.
        `,
        "What does an LLM generally predict during autoregressive text generation?",
        [
          "The next token in a sequence",
          "The next database record",
          "The next HTTP status code",
          "The next operating system update"
        ],
        0,
        "Autoregressive language models generate text by predicting successive next tokens."
      ),

      lesson(
        "probability-temperature-sampling",
        "Probability, Temperature, and Sampling",
        17,
        `
Language models calculate probability distributions
over possible next tokens.

The model uses these probabilities to generate text.

Temperature is a generation parameter
that influences the distribution used during sampling.

Lower temperature:

Generally makes output more predictable
and concentrates probability on higher-scoring tokens.

Higher temperature:

Generally increases randomness and allows
less likely tokens to be selected more often.

Example:

A technical support assistant may use a lower
temperature to encourage consistent responses.

A creative writing application may use a higher
temperature to encourage varied outputs.

Other generation settings may include:

Top-k:
Limits sampling to a specified number
of high-probability tokens.

Top-p:
Uses a cumulative probability threshold
to select a candidate set of tokens.

These settings influence generation behavior.

They do not guarantee factual accuracy,
reasoning quality, or consistency.
        `,
        "What is the general effect of increasing temperature during text generation?",
        [
          "It generally increases randomness in sampled outputs",
          "It guarantees correct answers",
          "It permanently retrains the model",
          "It eliminates all possible hallucinations"
        ],
        0,
        "Higher temperature generally produces more varied and less predictable sampled outputs."
      ),

      lesson(
        "hallucinations-context-grounding",
        "Understanding Hallucinations and Context Grounding",
        17,
        `
An AI hallucination occurs when a model generates
information that is false, unsupported,
or presented with unjustified confidence.

Hallucinations can occur because language models
generate responses based on learned patterns
rather than guaranteed access to verified facts.

Examples include:

- Invented citations.
- Incorrect technical explanations.
- Nonexistent software functions.
- Fabricated company information.
- Incorrect dates or statistics.

Ways to reduce hallucination risk include:

1. Provide relevant source material.
2. Use retrieval-augmented generation.
3. Require structured outputs.
4. Validate important facts.
5. Use appropriate tools and APIs.
6. Apply domain-specific evaluation.
7. Require human review for high-impact decisions.

Context grounding means giving a model relevant
information that should inform its response.

For example, a company assistant can retrieve
an approved internal policy before answering
an employee's question.

Grounding can improve reliability,
but it does not eliminate every error.

Enterprise AI systems should include appropriate
verification and accountability controls.
        `,
        "What is a hallucination in generative AI?",
        [
          "A response containing false or unsupported information",
          "A successfully validated database transaction",
          "A secure API authentication method",
          "A method for compressing images"
        ],
        0,
        "An AI hallucination is generated information that is false, unsupported, or misleadingly presented as factual."
      ),
    ]
  )
);

// ================================================
// MODULE 7 — TOKENS, CONTEXT WINDOWS, AND PARAMETERS
// ================================================

MODULES.push(
  moduleData(
    "tokens-context-windows-model-parameters",
    "Tokens, Context Windows, and Model Parameters",
    [
      lesson(
        "understanding-tokens",
        "Understanding Tokens and Tokenization",
        15,
        `
Language models process text using tokens.

A token is a unit of text recognized
by a model's tokenizer.

Tokens may represent:

- Whole words.
- Parts of words.
- Punctuation.
- Spaces or other text patterns.

For example, a long technical word may be divided
into several tokens.

Tokenization converts text into a sequence
of token identifiers.

The number of tokens is not always equal
to the number of words or characters.

Token counts matter because they influence:

- Model input limits.
- Output limits.
- API costs.
- Processing time.
- Context usage.

For example, an API provider may charge
based on input and output tokens.

AI engineers should understand token usage
when estimating application costs.

They should also account for system instructions,
conversation history, retrieved documents,
and generated responses.
        `,
        "Why is tokenization important when building LLM applications?",
        [
          "It determines how text is represented for model processing and affects usage limits and costs",
          "It automatically verifies every generated fact",
          "It replaces the need for an API",
          "It determines database permissions"
        ],
        0,
        "Tokenization converts text into model-readable units and influences context limits and usage costs."
      ),

      lesson(
        "context-windows",
        "Understanding Context Windows",
        16,
        `
A context window is the amount of token information
a model can process within a particular request.

The context may include:

- System instructions.
- Developer instructions.
- User messages.
- Conversation history.
- Retrieved documents.
- Tool outputs.
- Other input information.

Generated output also consumes tokens
within the model's supported limits.

A larger context window allows more information
to be considered in a single interaction.

However, a larger context window does not mean
the model will always use every detail accurately.

Poorly structured or irrelevant context
can reduce response quality.

Enterprise applications should manage context
carefully.

Common strategies include:

- Summarizing conversation history.
- Retrieving only relevant documents.
- Removing duplicate information.
- Limiting unnecessary tool outputs.
- Monitoring token consumption.

Context management is particularly important
for document analysis, AI assistants,
and retrieval-augmented generation systems.
        `,
        "What does a context window represent?",
        [
          "The amount of token information a model can process in a request",
          "The number of databases connected to an application",
          "The physical size of a GPU",
          "The number of users registered in a system"
        ],
        0,
        "A context window defines the token capacity available to a model for processing input and generating output."
      ),

      lesson(
        "model-parameters-architecture",
        "Model Parameters, Size, and Capabilities",
        16,
        `
Model parameters are numerical values learned
during model training.

They influence how a neural network processes
information and produces outputs.

A model with billions of parameters
may require substantial computing resources.

However, parameter count alone does not determine
model quality.

Other important factors include:

- Training data quality.
- Model architecture.
- Training methods.
- Context window.
- Inference optimization.
- Tool support.
- Evaluation results.

Model size can affect:

Memory requirements:
How much memory is needed to load the model.

Inference performance:
How efficiently the model can generate outputs.

Deployment cost:
The infrastructure required to operate the model.

Some systems use quantization to reduce
the numerical precision used to represent parameters.

Quantization can reduce memory requirements
and improve inference efficiency, sometimes
with tradeoffs in output quality.

Enterprise architects must evaluate the overall
performance and operational requirements
rather than selecting a model based only on size.
        `,
        "What are model parameters?",
        [
          "Learned numerical values that influence a neural network's behavior",
          "API passwords stored in a configuration file",
          "Database table names",
          "HTTP request headers"
        ],
        0,
        "Model parameters are learned numerical values that determine how a neural network processes information."
      ),
    ]
  )
);

// ================================================
// MODULE 8 — OPENAI AND OTHER MODEL PROVIDERS
// ================================================

MODULES.push(
  moduleData(
    "ai-model-providers",
    "OpenAI and Other Model Providers",
    [
      lesson(
        "understanding-model-providers",
        "Understanding AI Model Providers",
        15,
        `
AI model providers offer access to trained models
through APIs, managed platforms, and other services.

Examples include:

OpenAI:
Provides models and APIs for language,
reasoning, and other AI capabilities.

Anthropic:
Provides Claude model families and related services.

Google:
Provides Gemini models and AI development services.

Microsoft:
Provides enterprise AI services and access
to models through its cloud ecosystem.

AWS:
Provides managed AI and machine learning services
through Amazon Bedrock and related technologies.

Other providers and open model ecosystems
offer additional deployment options.

Organizations should evaluate providers based on:

- Model capabilities.
- Security controls.
- Data handling policies.
- Availability.
- Pricing.
- Latency.
- Regional deployment requirements.
- Integration capabilities.
- Service-level commitments.

Selecting a provider is an architectural decision,
not simply a matter of choosing the most popular model.
        `,
        "What should an enterprise consider when selecting an AI model provider?",
        [
          "Security, capability, cost, availability, and integration requirements",
          "Only the provider's logo",
          "Only the programming language used by the provider",
          "Whether the provider has the largest website"
        ],
        0,
        "Enterprise model selection should consider technical, security, financial, and operational requirements."
      ),

      lesson(
        "hosted-vs-self-hosted-models",
        "Hosted Models Versus Self-Hosted Models",
        16,
        `
Organizations can access AI models in different ways.

Hosted Models:

A provider operates the model infrastructure
and exposes access through a managed service or API.

Potential advantages:

- Reduced infrastructure management.
- Faster implementation.
- Managed scaling.
- Access to provider-supported models.

Potential considerations:

- Usage-based costs.
- Provider dependency.
- Data handling requirements.
- Network latency.
- Service availability.

Self-Hosted Models:

An organization deploys and operates models
within infrastructure it controls.

Potential advantages:

- Greater deployment control.
- More customization options.
- Potentially different data governance arrangements.

Potential considerations:

- Infrastructure costs.
- GPU availability.
- Model maintenance.
- Security responsibilities.
- Scaling complexity.
- Operational expertise.

Some organizations use a hybrid approach.

The correct choice depends on business requirements,
data sensitivity, regulatory obligations,
performance, and total cost of ownership.
        `,
        "What is a major responsibility associated with self-hosting an AI model?",
        [
          "Managing the model infrastructure and operational environment",
          "Eliminating all infrastructure costs",
          "Avoiding all security responsibilities",
          "Guaranteeing unlimited model capacity"
        ],
        0,
        "Self-hosting requires the organization to operate and maintain the model infrastructure."
      ),

      lesson(
        "model-selection-strategy",
        "Choosing the Right AI Model for an Enterprise",
        17,
        `
Selecting an AI model requires understanding
the business problem and its technical requirements.

Start with the use case.

Examples:

Customer Support:
Requires reliable responses and appropriate
access to approved information.

Document Processing:
Requires strong extraction and structured output
capabilities.

Software Development:
May benefit from models optimized for code generation.

Complex Analysis:
May require models with stronger reasoning capabilities.

Evaluate candidate models using:

Accuracy:
How well the model performs the required task.

Latency:
How quickly the model responds.

Cost:
The expense of processing expected workloads.

Context Capacity:
The amount of information the model can process.

Security:
How data is protected and handled.

Reliability:
How consistently the service operates.

Integration:
How easily the model connects to existing systems.

Governance:
Whether the solution satisfies organizational
and regulatory requirements.

A good selection process uses representative tests
rather than relying exclusively on demonstrations
or vendor marketing.
        `,
        "What is the best way to compare AI models for a specific enterprise use case?",
        [
          "Evaluate them against representative business requirements and measurable criteria",
          "Choose the model with the longest name",
          "Select the most expensive model automatically",
          "Use the first model found online"
        ],
        0,
        "Models should be evaluated using representative workloads and measurable technical and business criteria."
      ),
    ]
  )
);

// END OF SECTION 2
// ================================================
// MODULE 9 — WORKING WITH LLM APIs
// ================================================

MODULES.push(
  moduleData(
    "working-with-llm-apis",
    "Working with LLM APIs",
    [
      lesson(
        "llm-api-fundamentals",
        "Introduction to LLM APIs",
        16,
        `
LLM APIs allow applications to communicate with
hosted language models.

Instead of operating a model directly, an application
sends a request to a provider's API.

The provider processes the request and returns
a generated response.

A typical workflow:

1. The application receives a user question.
2. The backend constructs a model request.
3. The backend authenticates with the provider.
4. The request is sent to the LLM API.
5. The provider generates a response.
6. The backend processes the response.
7. The application returns the result to the user.

Python applications can communicate with LLM APIs
using HTTP libraries or provider-specific SDKs.

Common request information includes:

- Model identifier.
- Instructions.
- User input.
- Generation settings.
- Optional tools.
- Output format requirements.

API credentials must be protected.

Do not expose privileged API keys in Angular
components or browser JavaScript.

Use secure backend services and secrets management.
        `,
        "Where should an application's privileged LLM API key be stored?",
        [
          "In public frontend JavaScript",
          "In secure backend configuration or a secrets manager",
          "Inside a public Git repository",
          "In an HTML comment"
        ],
        1,
        "Privileged API credentials should be stored securely on the backend or in a secrets manager."
      ),

      lesson(
        "python-llm-api-integration",
        "Connecting Python Applications to LLM APIs",
        18,
        `
Python can connect to hosted language models
through provider SDKs or HTTP requests.

A typical integration requires:

1. Installing the provider SDK.
2. Configuring authentication.
3. Creating a client.
4. Sending instructions and user input.
5. Receiving the generated response.
6. Handling errors and usage information.

Example using an environment variable:

import os

api_key = os.environ["AI_API_KEY"]

The application should retrieve credentials
from a secure environment rather than hardcoding them.

A conceptual integration workflow:

from provider_sdk import Client

client = Client(
    api_key=api_key
)

response = client.generate(
    model="MODEL_NAME",
    input="Explain enterprise architecture."
)

print(response)

The exact SDK and method names depend
on the selected provider.

Production applications should also implement:

- Request timeouts.
- Error handling.
- Usage tracking.
- Retry policies.
- Logging.
- Cost monitoring.

An LLM integration is a backend dependency
and should be managed like other enterprise services.
        `,
        "Why should an application use environment variables or a secrets manager for API credentials?",
        [
          "To protect credentials from being exposed in source code",
          "To automatically train the model",
          "To increase the model's context window",
          "To eliminate network latency"
        ],
        0,
        "Secure configuration helps keep sensitive credentials out of application source code and public repositories."
      ),

      lesson(
        "llm-structured-outputs-tools",
        "Structured Outputs and Tool Calling",
        18,
        `
LLM applications often need responses
that follow a predictable structure.

Structured outputs allow applications
to request information in formats such as JSON.

Example:

{
  "category": "technical_support",
  "priority": "high",
  "summary": "Database connection failure"
}

Structured output is useful for:

- Data extraction.
- Classification.
- Workflow automation.
- Form population.
- Enterprise integrations.

Tool calling allows a model to request
that an application execute an available operation.

Example:

A user asks:

"What is the status of my job application?"

The model may request a tool named:

get_application_status

The backend executes the authorized operation
and returns the result to the model.

The model can then formulate a response.

Important security principle:

The model should not directly receive unrestricted
access to databases or enterprise systems.

The application must validate tool requests,
authenticate the user, enforce authorization,
and validate operation parameters.

Tool calling does not mean the model itself
has unrestricted permission to execute actions.
        `,
        "What is an important security responsibility when implementing LLM tool calling?",
        [
          "Allow every tool to access all databases",
          "Validate tool requests and enforce authorization in the backend",
          "Trust every model-generated argument",
          "Disable authentication"
        ],
        1,
        "The backend must validate tool requests and enforce permissions before executing operations."
      ),
    ]
  )
);

// ================================================
// MODULE 10 — MODEL EVALUATION AND PERFORMANCE
// ================================================

MODULES.push(
  moduleData(
    "model-evaluation-performance",
    "Model Evaluation and Performance",
    [
      lesson(
        "evaluating-model-quality",
        "Evaluating AI Model Quality",
        16,
        `
AI model evaluation determines how well a model
performs a particular task.

A model that performs well in a demonstration
may perform poorly in real business scenarios.

Evaluation should use representative examples
from the intended application.

Important evaluation dimensions include:

Accuracy:
How often the model produces correct results.

Precision:
How many predicted positive results are actually positive.

Recall:
How many actual positive cases the model identifies.

F1 Score:
A combined measure of precision and recall.

For generative AI, additional evaluation dimensions
may include:

- Relevance.
- Completeness.
- Factual consistency.
- Instruction following.
- Output format compliance.
- Safety.
- Grounding in source material.

Example:

A document extraction model is expected to identify
invoice numbers, dates, and payment amounts.

Its evaluation should compare extracted values
against verified reference data.

Evaluation should be repeated when prompts,
models, datasets, or application workflows change.
        `,
        "Why should AI models be evaluated using representative business examples?",
        [
          "To understand how they perform in the intended real-world use case",
          "To guarantee that they will never make mistakes",
          "To eliminate the need for testing",
          "To increase their parameter count automatically"
        ],
        0,
        "Representative evaluation examples reveal how well a model performs under realistic application conditions."
      ),

      lesson(
        "llm-performance-latency-cost",
        "Model Performance, Latency, and Cost",
        16,
        `
Enterprise AI applications must balance performance,
response time, and operating costs.

Latency:

The time required for a request to produce
a response.

Throughput:

The amount of work a system can process
during a given period.

Token Consumption:

The number of input and output tokens processed.

Cost:

The expense associated with model usage
and supporting infrastructure.

Performance can be influenced by:

- Model size.
- Input length.
- Output length.
- Network conditions.
- Provider capacity.
- Infrastructure configuration.
- Concurrent requests.

Ways to improve efficiency include:

- Selecting an appropriate model.
- Reducing unnecessary prompt content.
- Limiting output length.
- Caching appropriate results.
- Using asynchronous processing.
- Monitoring token usage.
- Routing simple tasks to less expensive models.

For example, a simple classification task
may not require the most expensive model available.

Model selection should reflect actual workload needs.
        `,
        "What does latency measure in an AI application?",
        [
          "The time required for a request to produce a response",
          "The number of database tables",
          "The number of model parameters only",
          "The size of an organization's workforce"
        ],
        0,
        "Latency measures the time taken for a request to receive a response."
      ),

      lesson(
        "responsible-ai-model-monitoring",
        "Responsible AI and Model Monitoring",
        17,
        `
Responsible AI involves developing and operating
AI systems in ways that address safety, fairness,
privacy, accountability, and transparency.

Important considerations include:

Bias:
Models may produce different outcomes
for different groups or circumstances.

Privacy:
Applications must protect personal
and confidential information.

Transparency:
Organizations should communicate
appropriate information about AI usage.

Security:
AI applications must protect models,
data, integrations, and users.

Human Oversight:
Important decisions may require review
by qualified people.

Model Monitoring:

AI systems should be monitored after deployment.

Monitor:

- Response quality.
- Error rates.
- Latency.
- Token consumption.
- Cost.
- Safety-related events.
- User feedback.
- Changes in input data.

Model behavior may change when application
requirements, prompts, providers, or underlying
models change.

Establish evaluation processes and escalation
procedures for unexpected behavior.

AI governance should be integrated into
the solution lifecycle rather than added
only after deployment.
        `,
        "What is an important component of responsible AI deployment?",
        [
          "Ignoring model errors after deployment",
          "Monitoring model behavior and maintaining appropriate human oversight",
          "Removing all security controls",
          "Allowing AI systems to make every decision without review"
        ],
        1,
        "Responsible AI includes ongoing monitoring, accountability, and appropriate human oversight."
      ),
    ]
  )
);

// ================================================
// MODULE 11 — PRACTICAL AI ENGINEERING PROJECT
// ================================================

MODULES.push(
  moduleData(
    "practical-ai-engineering-project",
    "Practical AI Engineering Project",
    [
      lesson(
        "designing-an-ai-application",
        "Project: Designing an AI-Powered Application",
        18,
        `
Your final project begins with designing
an AI-powered enterprise application.

Scenario:

Zebron Enterprise Assistant.

Business Requirement:

An organization wants an AI assistant
that can answer employee questions about
internal processes and services.

The assistant should:

- Accept natural-language questions.
- Connect to an LLM.
- Generate useful responses.
- Provide structured results where required.
- Support backend integration.
- Protect sensitive information.

Proposed architecture:

Angular Frontend
        |
        v
Python Backend API
        |
        v
Authentication and Authorization
        |
        v
LLM Integration Service
        |
        v
AI Model Provider
        |
        v
Response Processing
        |
        v
Frontend

The backend should manage API credentials
and control access to the model provider.

Before implementation, document:

1. Business requirements.
2. Intended users.
3. Supported use cases.
4. Security requirements.
5. Model selection criteria.
6. Expected response times.
7. Usage and cost expectations.

A good AI engineering project starts
with a clearly defined problem.
        `,
        "What should be established before selecting an LLM for an enterprise application?",
        [
          "Business requirements and technical constraints",
          "The application's logo",
          "The number of frontend buttons",
          "The database's display color"
        ],
        0,
        "Model selection should follow an understanding of business requirements and technical constraints."
      ),

      lesson(
        "building-an-ai-api",
        "Project: Building an AI-Powered Python API",
        20,
        `
The next project step is to expose AI functionality
through a backend API.

Use Python and FastAPI.

A conceptual architecture:

POST /api/v1/assistant/chat

Request:

{
  "message": "Explain enterprise risk management"
}

Backend workflow:

1. Receive the request.
2. Authenticate the caller.
3. Validate the input.
4. Apply request limits.
5. Construct the model request.
6. Call the LLM provider.
7. Process the response.
8. Return the result.

Example response:

{
  "answer": "Enterprise risk management...",
  "model": "selected-model",
  "status": "completed"
}

The backend should implement:

- Secure API credentials.
- Input validation.
- Request timeouts.
- Error handling.
- Logging.
- Usage monitoring.

The frontend should communicate with
the backend API rather than calling a privileged
model provider directly.

This separation provides a controlled location
for security, integration, and business logic.
        `,
        "Why should the Angular frontend call the backend API instead of directly using a privileged LLM API key?",
        [
          "The backend protects credentials and enforces application controls",
          "Angular cannot send HTTP requests",
          "The LLM only accepts database connections",
          "The frontend automatically trains the model"
        ],
        0,
        "The backend protects provider credentials and provides a trusted location for validation and authorization."
      ),

      lesson(
        "ai-engineering-capstone",
        "Final Assessment: AI Engineering Fundamentals",
        20,
        `
Congratulations on completing AI Engineering
Fundamentals and Large Language Models.

Review the major concepts:

Artificial Intelligence:
Understand the broader field and its applications.

Machine Learning:
Understand supervised, unsupervised,
and reinforcement learning.

Deep Learning:
Understand neural networks and training.

Transformers:
Understand attention and modern model architecture.

Large Language Models:
Understand foundation models and language generation.

Inference:
Understand tokenization, next-token prediction,
and response generation.

Context Management:
Understand tokens and context windows.

Model Providers:
Understand hosted and self-hosted options.

LLM APIs:
Understand authentication, requests,
structured outputs, and tool calling.

Evaluation:
Understand quality, latency, cost,
and responsible AI monitoring.

Practical Engineering:
Understand how to integrate an LLM
into a secure backend application.

Your next learning stage will explore
prompt engineering, structured interactions,
embeddings, vector databases, and retrieval-augmented
generation.

The objective is to move from understanding AI
to designing and implementing production-oriented
AI applications.
        `,
        "Which capability is most important when moving from basic LLM usage toward enterprise AI engineering?",
        [
          "Connecting models to secure applications with evaluation, monitoring, and governance",
          "Using the largest model for every task",
          "Removing backend services",
          "Ignoring model costs"
        ],
        0,
        "Enterprise AI engineering combines model integration with security, evaluation, monitoring, and governance."
      ),
    ]
  )
);

// ================================================
// COURSE METADATA
// ================================================

const COURSE = {
  id: COURSE_ID,

  title: "AI Engineering Fundamentals & LLMs",

  subtitle:
    "Understanding Machine Learning, Transformers, and Large Language Models",

  description: `
Build a strong foundation in artificial intelligence,
machine learning, deep learning, and large language models.

Explore neural networks, transformer architecture,
attention mechanisms, model training, inference,
tokenization, context windows, and AI model providers.

Learn how to connect Python applications to LLM APIs,
implement structured outputs and tool calling,
evaluate model quality, and monitor performance.

Through a practical enterprise AI project,
learn how to design and integrate an AI-powered
application using secure backend architecture.

This course prepares learners for advanced study
in prompt engineering, retrieval-augmented generation,
AI agents, and enterprise AI architecture.
  `.trim(),

  level: "beginner",
  status: "draft",
  language: "en",

  topic: "Artificial Intelligence and AI Engineering",
  cover: "teal",

  program: "Enterprise AI & Solutions Architecture",
  programOrder: 5,

  estimatedMinutes: MODULES.reduce(
    (total, currentModule) =>
      total +
      currentModule.lessons.reduce(
        (moduleTotal, currentLesson) =>
          moduleTotal + currentLesson.minutes,
        0
      ),
    0
  ),

  modules: MODULES.map((currentModule, moduleIndex) => ({
    id: currentModule.id,
    title: currentModule.title,
    order: moduleIndex + 1,

    lessons: currentModule.lessons.map(
      (currentLesson, lessonIndex) => ({
        id: currentLesson.id,
        title: currentLesson.title,
        order: lessonIndex + 1,
        duration: currentLesson.minutes,
      })
    ),
  })),

  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp(),
};

// ================================================
// VALIDATION
// ================================================

const allLessons = MODULES.flatMap(
  (currentModule) => currentModule.lessons
);

const totalLessons = allLessons.length;

const totalQuickChecks = allLessons.reduce(
  (total, currentLesson) =>
    total +
    currentLesson.blocks.filter(
      (block) => block.type === "check"
    ).length,
  0
);

const moduleIds = MODULES.map(
  (currentModule) => currentModule.id
);

const lessonIds = allLessons.map(
  (currentLesson) => currentLesson.id
);

if (MODULES.length !== 11) {
  throw new Error(
    `Expected 11 modules, found ${MODULES.length}.`
  );
}

if (totalLessons !== 33) {
  throw new Error(
    `Expected 33 lessons, found ${totalLessons}.`
  );
}

if (totalQuickChecks !== 33) {
  throw new Error(
    `Expected 33 Quick Checks, found ${totalQuickChecks}.`
  );
}

if (new Set(moduleIds).size !== moduleIds.length) {
  throw new Error("Duplicate module IDs detected.");
}

if (new Set(lessonIds).size !== lessonIds.length) {
  throw new Error("Duplicate lesson IDs detected.");
}

for (const currentLesson of allLessons) {
  const quickChecks = currentLesson.blocks.filter(
    (block) => block.type === "check"
  );

  if (quickChecks.length !== 1) {
    throw new Error(
      `Lesson ${currentLesson.id} must contain exactly one Quick Check.`
    );
  }

  for (const currentCheck of quickChecks) {
    if (
      !Array.isArray(currentCheck.options) ||
      currentCheck.answer < 0 ||
      currentCheck.answer >= currentCheck.options.length
    ) {
      throw new Error(
        `Invalid Quick Check in lesson ${currentLesson.id}.`
      );
    }
  }
}

console.log("\nCourse validation successful.");
console.log(`Modules: ${MODULES.length}`);
console.log(`Lessons: ${totalLessons}`);
console.log(`Quick Checks: ${totalQuickChecks}`);
console.log(`Estimated minutes: ${COURSE.estimatedMinutes}`);

// ================================================
// FIRESTORE SEEDING
// ================================================

async function seedCourse() {
  const courseRef = db
    .collection("courses")
    .doc(COURSE_ID);

  const existingCourse = await courseRef.get();

  if (existingCourse.exists && !OVERWRITE) {
    console.log(`\nCourse "${COURSE_ID}" already exists.`);

    console.log(
      "No changes were made. Use --overwrite to replace the seeded course."
    );

    return;
  }

  if (!APPLY) {
    console.log("\nDRY RUN — no Firestore writes performed.");

    console.log("\nCourse details:");

    console.log(
      JSON.stringify(
        {
          id: COURSE.id,
          title: COURSE.title,
          status: COURSE.status,
          language: COURSE.language,
          modules: MODULES.length,
          lessons: totalLessons,
          quickChecks: totalQuickChecks,
          estimatedMinutes: COURSE.estimatedMinutes,
        },
        null,
        2
      )
    );

    console.log("\nTo write this course to Firebase, run:");

    console.log(
      "node scripts/ai-engineering/seed-ai-engineering-fundamentals.mjs --apply"
    );

    return;
  }

  const batch = db.batch();

  batch.set(courseRef, COURSE);

  for (const currentModule of MODULES) {
    for (const [lessonIndex, currentLesson] of
      currentModule.lessons.entries()) {
      const lessonRef = courseRef
        .collection("lessons")
        .doc(currentLesson.id);

      batch.set(lessonRef, {
        id: currentLesson.id,
        courseId: COURSE_ID,
        moduleId: currentModule.id,
        moduleTitle: currentModule.title,
        title: currentLesson.title,
        order: lessonIndex + 1,
        duration: currentLesson.minutes,
        blocks: currentLesson.blocks,
        status: "draft",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }

  await batch.commit();

  console.log("\nCourse successfully saved to Firestore.");
  console.log(`Course ID: ${COURSE_ID}`);
  console.log(`Modules: ${MODULES.length}`);
  console.log(`Lessons: ${totalLessons}`);
  console.log(`Quick Checks: ${totalQuickChecks}`);
  console.log(`Estimated minutes: ${COURSE.estimatedMinutes}`);
}

// ================================================
// EXECUTE
// ================================================

seedCourse()
  .then(() => {
    console.log("\nSeeding process completed.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nSeeding failed:", error);
    process.exit(1);
  });

// END OF SECTION 3