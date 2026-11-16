/**
 * AI Engineering Fundamentals & LLMs
 * Program: Enterprise AI & Solutions Architecture, step 5
 *
 * Dry run (checks the content, writes nothing):
 *   node scripts/ai-engineering/seed-ai-engineering-fundamentals.mjs
 * Create the course:
 *   node scripts/ai-engineering/seed-ai-engineering-fundamentals.mjs --apply
 * Update an existing course (keeps its status, publish date and final exam):
 *   node scripts/ai-engineering/seed-ai-engineering-fundamentals.mjs --apply --overwrite
 *
 * Lesson text uses the light Markdown lessons support: # / ## / ### headings,
 * - and 1. lists, **bold**, *italic*, `code`, ``` code blocks, > quotes and
 * | tables |. Each text block is one section in the lesson player; its first
 * heading is the section title.
 */

import { runCourseSeed } from '../lib/write-zebron-course.mjs';

const COURSE = {
  id: "ai-engineering-fundamentals-llms",
  title: "AI Engineering Fundamentals & LLMs",
  summary: "Understanding Machine Learning, Transformers, and Large Language Models",
  description: "Build a strong foundation in artificial intelligence, machine learning, deep learning, and large language models.\n\nExplore neural networks, transformer architecture, attention mechanisms, model training, inference, tokenization, context windows, and AI model providers.\n\nLearn how to connect Python applications to LLM APIs, implement structured outputs and tool calling, evaluate model quality, and monitor performance.\n\nThrough a practical enterprise AI project, learn how to design and integrate an AI-powered application using secure backend architecture.\n\nThis course prepares learners for advanced study in prompt engineering, retrieval-augmented generation, AI agents, and enterprise AI architecture.",
  topic: "Artificial Intelligence and AI Engineering",
  program: "Enterprise AI & Solutions Architecture",
  programOrder: 5,
  level: "beginner",
  cover: "teal",
  outcomes: [
    "Explain how AI, machine learning, and deep learning relate",
    "Describe how neural networks, transformers, and attention work",
    "Explain how LLMs generate text, and the role of tokens and context windows",
    "Compare hosted and self-hosted models and choose one for a use case",
    "Call LLM APIs securely and evaluate model performance",
  ],
  skills: [
    "Machine learning basics",
    "Neural networks",
    "Transformers",
    "Large language models",
    "Tokens and context windows",
    "LLM APIs",
    "Model selection",
    "Model evaluation",
  ],
};

const MODULES = [
  {
    id: "introduction-to-artificial-intelligence",
    title: "Introduction to Artificial Intelligence",
    lessons: [
      {
        id: "understanding-artificial-intelligence",
        title: "Understanding Artificial Intelligence",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Understanding Artificial Intelligence

Artificial intelligence (AI) is the field of computer science that builds systems able to perform tasks we usually associate with human intelligence: understanding language, recognizing images, making predictions, planning, and making decisions.

## Rules versus learning

Early AI systems were mostly **rule-based**. Experts wrote explicit rules, such as "if the invoice total is over $10,000, route it to a manager". Rule-based systems are predictable and easy to explain, but they break when situations aren't covered by the rules.

Most modern AI **learns from data** instead. Rather than writing every rule, engineers give a model many examples and let it find the patterns. A spam filter, for example, learns what spam looks like from thousands of labelled emails.

| Approach | Strengths | Weaknesses |
| --- | --- | --- |
| Rule-based | Predictable, explainable, no training data needed | Brittle; hard to maintain as rules multiply |
| Learned from data | Handles messy, varied input; improves with data | Needs good data; harder to explain; can be wrong in surprising ways |

Real systems often combine both: a model classifies a support ticket, and business rules decide who may approve the action.

## Where AI is used today

- **Language:** chat assistants, summarization, translation, drafting.
- **Vision:** document scanning, defect detection, medical image support.
- **Prediction:** demand forecasting, fraud detection, churn risk.
- **Recommendation:** products, courses, or articles a user may like.
- **Automation:** routing requests, extracting data from forms, triaging incidents.

## What AI is not

AI systems don't understand the world the way people do. A language model predicts likely text; it doesn't check facts unless it is connected to sources that let it. Treat AI output as a strong draft or a recommendation that your application validates, not as guaranteed truth.

## Key points

- AI covers systems that perform tasks associated with human intelligence.
- Modern AI mostly learns patterns from data rather than following hand-written rules.
- Combine models with rules, validation, and human oversight in business systems.`,
          },
          {
            type: 'check',
            question: "What is the main difference between rule-based systems and machine learning systems?",
            options: [
              "Rule-based systems can only process images, while machine learning handles text",
              "Rule-based systems follow hand-written rules; machine learning systems learn patterns from data",
              "Machine learning systems are always easier to explain than rule-based systems",
              "Rule-based systems need training data; machine learning systems do not",
            ],
            answer: 1,
            explanation: "Rule-based systems follow rules people write. Machine learning systems learn patterns from examples, which makes them flexible but harder to explain.",
          },
        ],
      },
      {
        id: "types-of-artificial-intelligence",
        title: "Types and Categories of Artificial Intelligence",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Types and Categories of Artificial Intelligence

AI is classified in several ways. Knowing the common terms helps you read vendor claims critically and describe solutions accurately.

## By capability

| Category | Meaning | Status |
| --- | --- | --- |
| **Narrow AI** | Performs specific tasks, such as translation or fraud detection | Every AI system in use today |
| **General AI (AGI)** | Would match human ability across almost any intellectual task | Not achieved; actively debated |
| **Superintelligence** | Would exceed human ability in nearly every area | Hypothetical |

Even very capable language models are considered narrow AI: they are trained for language tasks and can fail at things a person finds easy.

## By technique

- **Rule-based / symbolic AI:** logic and explicit rules written by experts.
- **Machine learning:** models learn from data (covered in the next module).
- **Deep learning:** machine learning with large neural networks.
- **Generative AI:** models that create new text, images, audio, video, or code.

## By task

| Task | Example |
| --- | --- |
| Classification | Is this ticket about hardware, software, or access? |
| Regression | How many tickets will arrive next week? |
| Clustering | Which customers behave similarly? |
| Generation | Draft a reply to this customer |
| Recommendation | Which course should this learner take next? |
| Detection | Is this login attempt unusual? |

Most enterprise projects are a combination: for example, classify an incoming request, retrieve related documents, and generate a draft reply.

## Predictive versus generative AI

- **Predictive AI** outputs a label, number, or score. Its output can be checked against a known answer.
- **Generative AI** produces new content. Quality is harder to measure, so it needs evaluation, grounding in trusted data, and review.

## Key points

- All AI in production today is narrow AI.
- Describe a solution by the technique it uses and the task it performs.
- Generative output needs more validation than a predictive score.`,
          },
          {
            type: 'check',
            question: "Which category describes every AI system in production today, including large language models?",
            options: [
              "Symbolic AI only",
              "General AI",
              "Superintelligence",
              "Narrow AI",
            ],
            answer: 3,
            explanation: "Today's systems, however capable, are built for specific kinds of tasks and are classed as narrow AI. General AI has not been achieved.",
          },
        ],
      },
      {
        id: "ai-ml-dl-generative-ai",
        title: "Understanding AI, Machine Learning, Deep Learning, and Generative AI",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Understanding AI, Machine Learning, Deep Learning, and Generative AI

These four terms are often used interchangeably, but they describe different, nested ideas.

\`\`\`text
Artificial intelligence
  └─ Machine learning
       └─ Deep learning
            └─ Large language models and most modern generative AI
\`\`\`

## Artificial intelligence

The whole field: any technique that lets computers perform tasks associated with intelligence, including rules, search, and learning.

## Machine learning (ML)

A subset of AI in which systems **learn patterns from data** to make predictions or decisions. Examples: predicting which customers will cancel a subscription, or detecting fraudulent transactions. Many ML models are small and fast and work on tables of data.

## Deep learning (DL)

A subset of ML that uses **neural networks with many layers**. Deep learning shines with unstructured data such as images, audio, and text, where hand-crafting features is impractical. It typically needs more data and computing power than classic ML.

## Generative AI

AI that **creates new content**: text, images, audio, video, or code. Most modern generative AI is built on deep learning. **Large language models (LLMs)** are generative models specialised in language.

## Choosing the right tool

| Problem | Often a good fit |
| --- | --- |
| Predict a number or category from a table of data | Classic machine learning |
| Recognize objects in photos | Deep learning (computer vision) |
| Summarize documents or draft replies | Generative AI / LLMs |
| Apply a fixed policy, such as approval limits | Rules, not AI |

A common mistake is using an LLM for everything. If a simple model or a rule solves the problem reliably and cheaply, prefer it.

## Key points

- AI ⊃ machine learning ⊃ deep learning; LLMs are deep learning models that generate language.
- Classic ML suits structured data; deep learning suits images, audio, and text.
- Match the technique to the problem instead of defaulting to the largest model.`,
          },
          {
            type: 'check',
            question: "How is deep learning related to machine learning?",
            options: [
              "Deep learning is a rule-based alternative to machine learning",
              "Deep learning is a subset of machine learning that uses many-layered neural networks",
              "Machine learning is a subset of deep learning",
              "They are separate fields with no overlap",
            ],
            answer: 1,
            explanation: "Deep learning is one kind of machine learning: it learns from data using neural networks with many layers.",
          },
        ],
      },
    ],
  },
  {
    id: "understanding-machine-learning",
    title: "Understanding Machine Learning",
    lessons: [
      {
        id: "machine-learning-fundamentals",
        title: "Machine Learning Fundamentals",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Machine Learning Fundamentals

Machine learning lets a system learn patterns from examples instead of following explicit rules. The result of training is a **model**: a function that takes input and produces a prediction.

## Key vocabulary

| Term | Meaning | Example |
| --- | --- | --- |
| **Features** | The input values the model uses | Ticket length, product, time of day |
| **Label** | The correct answer for a training example | "Hardware" |
| **Training** | Adjusting the model so its predictions match the labels | Learning from 50,000 past tickets |
| **Inference** | Using the trained model on new data | Classifying today's tickets |
| **Parameters** | Internal values learned in training | Weights in a model |

## The workflow

1. **Define the problem** and how success will be measured.
2. **Collect and clean data.** Most project time goes here.
3. **Split the data** into training, validation, and test sets.
4. **Train** candidate models on the training set.
5. **Tune** using the validation set.
6. **Evaluate** once on the untouched test set.
7. **Deploy** and **monitor**, because data changes over time.

## Overfitting and underfitting

- **Overfitting:** the model memorizes the training data, including its noise, and performs poorly on new data. Sign: high training accuracy, low test accuracy.
- **Underfitting:** the model is too simple to capture the pattern and performs poorly everywhere.

Holding back test data the model never sees in training is how you detect overfitting.

## Data quality matters most

A model can only learn what is in its data. Missing values, wrong labels, or data that doesn't represent real users lead to poor or biased models. "Garbage in, garbage out" is especially true in ML.

## Measuring performance

For classification, **accuracy** is the share of correct predictions, but it can mislead when classes are unbalanced. If 1% of transactions are fraud, a model that always says "not fraud" is 99% accurate and useless. **Precision** and **recall** tell you how many flagged cases were real, and how many real cases were caught.

## Key points

- A model maps features to predictions; training learns its parameters from labelled data.
- Keep a separate test set to detect overfitting.
- Data quality and the right metric matter more than the choice of algorithm.`,
          },
          {
            type: 'check',
            question: "A model scores 98% on its training data but 61% on the test data. What is the most likely problem?",
            options: [
              "Overfitting: it memorized the training data instead of learning general patterns",
              "The test set is too large to be useful",
              "The model needs fewer features to reach 98% on the test set",
              "Underfitting: the model is too simple to learn anything",
            ],
            answer: 0,
            explanation: "A large gap between training and test performance is the classic sign of overfitting.",
          },
        ],
      },
      {
        id: "supervised-unsupervised-learning",
        title: "Supervised and Unsupervised Learning",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Supervised and Unsupervised Learning

Machine learning approaches differ in what the training data contains.

## Supervised learning

The model learns from **labelled examples**: each input comes with the correct answer.

\`\`\`text
Input: "My laptop won't turn on"   →   Label: Hardware
Input: "Reset my VPN password"     →   Label: Access
\`\`\`

Two main kinds of supervised task:

- **Classification** predicts a category: spam or not spam, ticket category, approve or reject.
- **Regression** predicts a number: delivery time, next month's sales, house price.

Supervised learning is the most common approach in business, but labels can be expensive: someone has to mark thousands of examples correctly.

## Unsupervised learning

The data has **no labels**. The model looks for structure on its own.

- **Clustering** groups similar items, such as customer segments or similar support tickets.
- **Dimensionality reduction** compresses many features into fewer, for visualization or speed.
- **Anomaly detection** finds items that don't fit normal patterns, such as unusual logins.

Results need human interpretation: a clustering algorithm finds groups, but people decide what they mean.

## Semi-supervised and self-supervised learning

- **Semi-supervised:** a few labelled examples plus many unlabelled ones.
- **Self-supervised:** the data supplies its own labels. LLMs are pretrained this way: the "label" for each position in a text is simply the next word. This is why they can learn from huge amounts of unlabelled text.

## Choosing an approach

| Question | Approach |
| --- | --- |
| Do you have examples with correct answers? | Supervised |
| Do you want to discover groups or unusual cases? | Unsupervised |
| Do you have huge amounts of raw text or images? | Self-supervised pretraining (usually done by model providers) |

## Key points

- Supervised learning needs labelled data and predicts categories or numbers.
- Unsupervised learning finds structure such as clusters and anomalies.
- LLM pretraining is self-supervised: the next token is the label.`,
          },
          {
            type: 'check',
            question: "A team wants to group customers into segments without any predefined categories. Which approach fits?",
            options: [
              "Supervised classification",
              "Supervised regression",
              "Unsupervised learning, such as clustering",
              "Reinforcement learning with rewards",
            ],
            answer: 2,
            explanation: "With no labels and the goal of discovering groups, clustering, an unsupervised technique, is the natural choice.",
          },
        ],
      },
      {
        id: "reinforcement-learning",
        title: "Introduction to Reinforcement Learning",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Introduction to Reinforcement Learning

Reinforcement learning (RL) trains an **agent** to make a sequence of decisions by trial and error. Instead of labelled answers, the agent receives **rewards** or penalties for its actions and learns which behavior earns the most reward over time.

## The core loop

\`\`\`text
Agent observes the state  →  chooses an action  →  environment changes
        ↑                                                   │
        └──────────── receives a reward ←───────────────────┘
\`\`\`

| Term | Meaning | Example (warehouse robot) |
| --- | --- | --- |
| Agent | The learner making decisions | The robot's controller |
| Environment | Everything the agent interacts with | The warehouse |
| State | The current situation | Robot position, shelf locations |
| Action | A choice the agent makes | Move left, pick item |
| Reward | Feedback signal | +10 for a delivered item, −1 per wasted move |
| Policy | The agent's strategy | Which action to take in each state |

## Exploration versus exploitation

The agent must balance **exploring** new actions that might be better with **exploiting** actions it already knows work. Too little exploration and it never finds better strategies; too much and it wastes effort.

## Where RL is used

- Robotics and control systems.
- Game playing.
- Resource scheduling and optimization.
- **Training language models:** reinforcement learning from human feedback (RLHF) and related methods use human or AI preferences as rewards to make model answers more helpful and safer.

## Challenges

- Designing a reward that captures what you really want. A badly designed reward gets "gamed": the agent finds a shortcut that scores well but doesn't solve the real problem.
- Many trials are needed, so training often happens in simulation.
- Behavior can be hard to predict in situations it hasn't experienced.

For most business applications you won't train RL agents yourself, but you will use models shaped by it, and the idea of rewards and policies helps you understand AI agents later in the program.

## Key points

- RL learns from rewards through trial and error, not from labelled answers.
- The agent balances exploring new actions with exploiting known good ones.
- RLHF uses preference-based rewards to fine-tune language models.`,
          },
          {
            type: 'check',
            question: "In reinforcement learning, what does the agent learn from?",
            options: [
              "Rewards and penalties received after its actions",
              "Clusters it discovers in unlabelled data",
              "A labelled answer for every example",
              "Rules written by domain experts",
            ],
            answer: 0,
            explanation: "RL agents learn by acting and receiving rewards or penalties, gradually improving their policy.",
          },
        ],
      },
    ],
  },
  {
    id: "deep-learning-fundamentals",
    title: "Deep Learning Fundamentals",
    lessons: [
      {
        id: "understanding-deep-learning",
        title: "Understanding Deep Learning",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Understanding Deep Learning

Deep learning is machine learning with **neural networks that have many layers**. "Deep" refers to the number of layers between input and output.

## Why layers matter

Each layer transforms its input into a slightly more useful representation. In an image model:

1. Early layers detect edges and simple textures.
2. Middle layers combine those into shapes and parts.
3. Later layers recognize whole objects, such as "invoice" or "damaged part".

Language models work similarly: early layers capture word pieces and grammar; deeper layers capture meaning, context, and relationships across a whole passage.

The key advantage is that the network **learns these features itself**. In classic machine learning, engineers often had to design features by hand.

## What deep learning needs

| Requirement | Why |
| --- | --- |
| Large datasets | Many parameters need many examples to learn well |
| Specialized hardware | GPUs and similar chips run the matrix arithmetic in parallel |
| Careful training | Choices such as learning rate and regularization affect results |

## Strengths

- Excellent with unstructured data: images, audio, text, video.
- One architecture can be adapted to many tasks.
- Performance keeps improving with more data and compute, up to a point.

## Limitations

- **Hard to interpret:** it's difficult to explain why a network made a particular prediction.
- **Data- and compute-hungry:** training large models is expensive.
- **Can fail unexpectedly** on inputs unlike its training data.
- **Can absorb bias** present in training data.

For structured business data, such as rows in a table, classic models like gradient-boosted trees often match or beat deep learning with far less cost.

## Key points

- Deep learning uses many-layered neural networks that learn features automatically.
- It excels at unstructured data but needs lots of data and compute.
- Its predictions are hard to explain, so testing and monitoring are essential.`,
          },
          {
            type: 'check',
            question: "What is a key advantage of deep learning compared with classic machine learning?",
            options: [
              "Its predictions are always easy to explain",
              "It only works on structured tables of data",
              "It learns useful features automatically instead of relying on hand-designed ones",
              "It needs less data and computing power",
            ],
            answer: 2,
            explanation: "Deep networks learn their own feature representations layer by layer, which is why they work so well on images, audio, and text.",
          },
        ],
      },
      {
        id: "training-neural-networks",
        title: "How Neural Networks Learn",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# How Neural Networks Learn

Training a neural network means adjusting its **weights** (parameters) so that its predictions get closer to the correct answers. It happens in a repeated loop.

## The training loop

1. **Forward pass:** input flows through the layers and the network produces a prediction.
2. **Loss calculation:** a **loss function** measures how wrong the prediction is. Lower is better.
3. **Backpropagation:** the network calculates how much each weight contributed to the error, producing **gradients**.
4. **Weight update:** an **optimizer** (such as gradient descent or Adam) nudges each weight in the direction that reduces the loss.

This repeats over many **batches** of examples. One full pass over the training data is an **epoch**; training usually runs many epochs.

## Gradient descent, intuitively

Imagine standing on a hillside in fog and wanting to reach the valley. You feel the slope under your feet and take a step downhill. The gradient is the slope; the **learning rate** is the size of your step.

- Too large a learning rate: you overshoot the valley and bounce around.
- Too small: progress is painfully slow.

## Watching training

Engineers track the loss on both training and validation data:

| Pattern | Meaning | Response |
| --- | --- | --- |
| Both losses fall | Learning well | Continue |
| Training loss falls, validation rises | Overfitting | Stop early, add data, or regularize |
| Both stay high | Underfitting | Larger model, better features, longer training |

## Regularization

Techniques that reduce overfitting:

- **Dropout:** randomly ignore some neurons during training.
- **Weight decay:** penalize very large weights.
- **Early stopping:** stop when validation loss stops improving.
- **More or augmented data.**

## Key points

- Training repeats: forward pass, loss, backpropagation, weight update.
- The learning rate controls step size; it must be neither too large nor too small.
- Compare training and validation loss to spot overfitting.`,
          },
          {
            type: 'check',
            question: "What is backpropagation used for during training?",
            options: [
              "Splitting the dataset into training and test sets",
              "Choosing the network's architecture before training",
              "Running the finished model on new data in production",
              "Calculating gradients that show how each weight should change to reduce the error",
            ],
            answer: 3,
            explanation: "Backpropagation computes the gradient of the loss with respect to each weight, which the optimizer then uses to update the weights.",
          },
        ],
      },
      {
        id: "deep-learning-use-cases",
        title: "Deep Learning Applications and Use Cases",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Deep Learning Applications and Use Cases

Deep learning powers most of the AI features people use every day. Knowing the main families helps you recognize which kind of model fits a business problem.

## Computer vision

Models that analyze images and video.

- **Classification:** is this a photo of a damaged or undamaged part?
- **Object detection:** where are the vehicles in this camera frame?
- **Document understanding:** extract fields from scanned invoices and forms.
- **Medical imaging support:** highlight areas for a radiologist to review.

## Speech and audio

- **Speech-to-text** for meeting transcripts and call centers.
- **Text-to-speech** for accessible content and voice assistants.
- **Audio classification** such as detecting machine faults by sound.

## Natural language processing

- Classification and sentiment analysis of tickets, reviews, and emails.
- Translation and summarization.
- Question answering and chat assistants, now dominated by large language models.

## Recommendation and personalization

Deep models learn from user behavior to suggest products, content, or next steps, such as the next course for a learner.

## Time series and forecasting

Demand forecasting, capacity planning, and anomaly detection on metrics, although classic statistical models are often strong competitors.

## Generative applications

- Drafting text and code.
- Creating and editing images.
- Generating synthetic data for testing, used carefully.

## Choosing whether to use deep learning

| Ask | If yes |
| --- | --- |
| Is the data unstructured (images, audio, free text)? | Deep learning is a strong candidate |
| Is there a pretrained model for this task? | Start there instead of training from scratch |
| Do mistakes have serious consequences? | Plan for human review and monitoring |
| Is the data a small table of numbers? | Try simpler models first |

## Key points

- Vision, speech, language, recommendation, and generation are the main deep learning families.
- Start from pretrained models whenever possible.
- High-stakes uses need human review and ongoing monitoring.`,
          },
          {
            type: 'check',
            question: "A company wants to extract fields from thousands of scanned invoices. Which deep learning area applies?",
            options: [
              "Audio classification",
              "Computer vision and document understanding",
              "Reinforcement learning for robotics",
              "Time series forecasting",
            ],
            answer: 1,
            explanation: "Reading fields from scanned documents is a computer vision task, often called document understanding.",
          },
        ],
      },
    ],
  },
  {
    id: "neural-networks-transformers",
    title: "Neural Networks and Transformers",
    lessons: [
      {
        id: "neural-network-architecture",
        title: "Neural Network Architecture",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Neural Network Architecture

A neural network is a model loosely inspired by neurons in the brain. In practice it is a stack of mathematical operations with adjustable numbers called **weights**.

## Layers

| Layer | Role |
| --- | --- |
| **Input layer** | Receives the data, such as pixel values or token embeddings |
| **Hidden layers** | Transform the data step by step into more useful representations |
| **Output layer** | Produces the result: class probabilities, a number, or the next token |

## What a single neuron does

Each neuron:

1. Multiplies each input by a weight.
2. Adds the results plus a **bias**.
3. Passes the total through an **activation function**.

\`\`\`text
output = activation(w1·x1 + w2·x2 + w3·x3 + b)
\`\`\`

Activation functions such as **ReLU** (which turns negative values into 0) add non-linearity. Without them, stacking layers would be no more powerful than a single layer.

## Common architectures

| Architecture | Best known for |
| --- | --- |
| Feedforward (fully connected) | Simple tabular and classification tasks |
| Convolutional neural networks (CNNs) | Images, by detecting local patterns |
| Recurrent neural networks (RNNs, LSTMs) | Sequences, before transformers took over |
| **Transformers** | Language, and increasingly images, audio, and code |

## Parameters and size

The weights and biases are the model's **parameters**. A small classifier might have thousands; large language models have billions. More parameters can capture more complex patterns but cost more to train and run.

## Output layers for different tasks

- **Classification:** a softmax layer turns scores into probabilities that add up to 1.
- **Regression:** a single number.
- **Language models:** a probability for every token in the vocabulary, used to choose the next token.

## Key points

- Networks are layers of neurons that apply weights, a bias, and an activation function.
- Non-linear activations let deep networks learn complex patterns.
- Transformers are the dominant architecture for modern language models.`,
          },
          {
            type: 'check',
            question: "Why do neural networks use activation functions such as ReLU?",
            options: [
              "To reduce the number of parameters to zero",
              "To convert text into tokens before processing",
              "To store the training data inside the network",
              "To add non-linearity so stacked layers can learn complex patterns",
            ],
            answer: 3,
            explanation: "Without non-linear activations, many layers would collapse into the equivalent of one linear layer and couldn't model complex relationships.",
          },
        ],
      },
      {
        id: "attention-mechanism",
        title: "Understanding the Attention Mechanism",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Understanding the Attention Mechanism

Attention lets a model decide **which parts of the input matter most** when processing each piece of it. It is the key idea behind transformers and modern language models.

## The intuition

Read this sentence:

> The technician replaced the server's power supply because **it** was overheating.

To understand "it", you look back and connect it to "power supply". Attention does the same: for every token, the model calculates how strongly it should relate to every other token, then builds a representation that blends in the most relevant ones.

## How it works, simply

For each token the model creates three vectors:

| Vector | Role |
| --- | --- |
| **Query** | What this token is looking for |
| **Key** | What each token offers |
| **Value** | The information each token contributes |

The model compares a token's query with every key to get **attention scores**, turns them into weights that sum to 1, and takes a weighted mix of the values.

## Multi-head attention

Transformers run several attention "heads" in parallel. Different heads can learn different relationships: one may track grammar, another which noun a pronoun refers to, another long-range topic links.

## Why attention was a breakthrough

- **Long-range context:** any token can directly relate to any other, however far apart.
- **Parallel processing:** all tokens are processed together, unlike older recurrent networks that read one token at a time. This made training on huge datasets practical.

## The cost

Standard attention compares every token with every other, so its cost grows roughly with the **square** of the input length. This is one reason context windows have limits and long prompts cost more. Many newer models use optimizations to stretch this further.

## Key points

- Attention weighs how relevant each token is to every other token.
- Queries, keys, and values produce a weighted mix of relevant information.
- Attention enables long-range context and parallel training, at a cost that grows with input length.`,
          },
          {
            type: 'check',
            question: "What does the attention mechanism help a model determine?",
            options: [
              "The order in which documents are stored in a database",
              "Which parts of the input are most relevant to each token it processes",
              "How many tokens the model may accept in one request",
              "Which training examples to remove before fine-tuning",
            ],
            answer: 1,
            explanation: "Attention computes how strongly each token should relate to the others, so the model can focus on the most relevant context.",
          },
        ],
      },
      {
        id: "transformer-architecture",
        title: "Understanding the Transformer Architecture",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Understanding the Transformer Architecture

The transformer was introduced in the 2017 research paper "Attention Is All You Need". It replaced recurrent networks for language tasks and is the foundation of today's large language models.

## The building blocks

A transformer is a stack of identical **blocks**. Each block contains:

1. **Multi-head self-attention:** every token gathers information from the other tokens it finds relevant.
2. **Feed-forward network:** a small neural network applied to each token's representation.
3. **Residual connections and normalization:** shortcuts and scaling that keep training stable in very deep stacks.

Before the first block, tokens are converted to **embeddings** (vectors), and **positional information** is added so the model knows word order. Attention on its own has no sense of order.

## Encoders and decoders

| Variant | What it does | Examples of use |
| --- | --- | --- |
| **Encoder-only** | Reads the whole input to build a rich representation | Classification, search embeddings |
| **Decoder-only** | Generates text one token at a time, attending only to earlier tokens | Chat assistants and most LLMs |
| **Encoder-decoder** | Encodes an input, then decodes an output | Translation, summarization |

Most popular LLMs are **decoder-only**: they predict the next token given everything before it.

## Why transformers scale so well

- Attention processes all tokens in parallel, so training uses GPUs efficiently.
- Performance has kept improving as models, data, and compute grow, which is why model sizes increased so quickly.
- The same architecture works for text, code, images, and audio once inputs are turned into tokens.

## A simplified flow

\`\`\`text
Text → tokens → embeddings + positions
     → [attention → feed-forward] × N blocks
     → probabilities for the next token
\`\`\`

## Key points

- Transformers stack blocks of self-attention and feed-forward layers.
- Positional information supplies word order.
- Decoder-only transformers, which predict the next token, power most LLMs.`,
          },
          {
            type: 'check',
            question: "What do most large language models use to generate text?",
            options: [
              "An encoder-only transformer that classifies whole documents",
              "A rule engine that selects prewritten sentences",
              "A recurrent network that reads one character at a time",
              "A decoder-only transformer that predicts the next token from the tokens before it",
            ],
            answer: 3,
            explanation: "Most LLMs are decoder-only transformers: they repeatedly predict the next token based on all previous tokens.",
          },
        ],
      },
    ],
  },
  {
    id: "large-language-models",
    title: "Large Language Models (LLMs)",
    lessons: [
      {
        id: "understanding-large-language-models",
        title: "Understanding Large Language Models",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Understanding Large Language Models

A large language model (LLM) is a transformer trained on very large amounts of text, and often code and other data, to process and generate language.

## What LLMs can do

- Answer questions and explain concepts.
- Summarize, translate, and rewrite text.
- Classify and extract information from documents.
- Draft emails, reports, and code.
- Follow multi-step instructions and call tools when connected to them.

## How they work, in one sentence

An LLM repeatedly predicts the most suitable **next token** given everything before it. Capabilities such as summarizing or answering questions emerge from doing this extremely well after training on vast, varied text.

## What "large" means

"Large" refers to the number of **parameters**, often billions, and the size of the training data. Larger models tend to handle more complex reasoning and instructions, but cost more and respond more slowly.

## Important limitations

| Limitation | What it means for your application |
| --- | --- |
| **Knowledge cut-off** | The model doesn't know about events after its training data ends |
| **Hallucinations** | It can state false information fluently and confidently |
| **No built-in access to your data** | It only knows your documents if you supply them in the request |
| **Non-determinism** | The same prompt can produce different answers |
| **Context limits** | It can only consider a limited amount of text per request |

## Using LLMs responsibly in business

- Provide trusted context (for example with retrieval-augmented generation) instead of relying on the model's memory.
- Validate structured output before acting on it.
- Keep a person in the loop for decisions with real consequences.
- Protect personal and confidential data you send to a model.

## Key points

- LLMs are large transformers trained to predict the next token.
- They are versatile but can be wrong, out of date, and inconsistent.
- Ground them in trusted data and validate their output.`,
          },
          {
            type: 'check',
            question: "Why might an LLM give outdated answers about recent events?",
            options: [
              "It deletes older information each time it is used",
              "It always searches the internet but ignores new results",
              "Its knowledge comes from training data that ends at a cut-off date",
              "It can only read text written in the current year",
            ],
            answer: 2,
            explanation: "A model only knows what was in its training data, which stops at a cut-off date, unless current information is supplied in the request.",
          },
        ],
      },
      {
        id: "llm-training-lifecycle",
        title: "How Large Language Models Are Trained",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# How Large Language Models Are Trained

Training an LLM happens in stages. Each stage shapes a different part of the model's behavior.

## 1. Pretraining

The model reads an enormous amount of text (web pages, books, code, articles) and learns to predict the next token. This is **self-supervised**: the text itself provides the answers.

- Teaches grammar, facts, reasoning patterns, and coding conventions.
- Requires thousands of specialized chips running for weeks or months.
- Produces a **base model** that continues text but doesn't reliably follow instructions.

## 2. Instruction tuning (supervised fine-tuning)

The base model is trained on curated examples of instructions paired with good responses. It learns to behave like an assistant: answer the question, follow the requested format, ask for clarification when needed.

## 3. Preference alignment

People, or other models, compare responses and indicate which is better. Techniques such as reinforcement learning from human feedback (RLHF) use these preferences to make the model more helpful, honest, and safe, for example by declining harmful requests.

## 4. Evaluation and safety testing

Before release, models are tested on benchmarks, red-teamed for harmful behavior, and checked for bias and reliability.

## What this means for you

| Stage | Done by | Your role |
| --- | --- | --- |
| Pretraining | Model providers | Choose a suitable model |
| Instruction tuning and alignment | Model providers | Understand default behavior and limits |
| Customization | You, optionally | Prompting, retrieval, or fine-tuning for your use case |

Most organizations **never pretrain** a model. They select a provider's model and adapt it, usually with prompts and retrieval first, and fine-tuning only when that isn't enough.

## Key points

- Pretraining teaches general language; instruction tuning teaches assistant behavior; alignment improves helpfulness and safety.
- Pretraining is extremely expensive and done by providers.
- Enterprises adapt existing models rather than training their own from scratch.`,
          },
          {
            type: 'check',
            question: "Which training stage teaches a base model to follow instructions like an assistant?",
            options: [
              "Instruction tuning on examples of instructions and good responses",
              "Deployment to a production API",
              "Pretraining on large amounts of raw text",
              "Tokenization of the training data",
            ],
            answer: 0,
            explanation: "Pretraining produces a base model that continues text; instruction tuning on curated examples teaches it to follow instructions.",
          },
        ],
      },
      {
        id: "foundation-models",
        title: "Foundation Models and Specialized Models",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Foundation Models and Specialized Models

A **foundation model** is trained on broad data and can be adapted to many tasks. LLMs are the best-known foundation models, but there are also foundation models for images, speech, and code.

## Ways to adapt a foundation model

| Method | How it works | Cost and effort | Use when |
| --- | --- | --- | --- |
| **Prompting** | Give instructions and examples in the request | Lowest | Always start here |
| **Retrieval-augmented generation (RAG)** | Fetch relevant documents and include them in the prompt | Moderate | The model needs your organization's knowledge |
| **Fine-tuning** | Further train the model on your examples | Higher | You need a consistent style, format, or specialized behavior that prompting can't achieve |
| **Training from scratch** | Build a new model | Very high | Rarely justified outside research and large providers |

A practical rule: **prompt first, add retrieval for knowledge, fine-tune for behavior.** Fine-tuning is not a good way to teach a model facts that change; retrieval keeps knowledge current and traceable.

## Specialized models

Not every task needs a large general model:

- **Small language models** run faster and cheaper and can be hosted privately.
- **Embedding models** turn text into vectors for search and RAG.
- **Domain models** are tuned for fields such as code, medicine, or law.
- **Classifiers** handle narrow tasks such as spam or sentiment very efficiently.

## Choosing between them

- Use a large general model when tasks are varied or need complex reasoning.
- Use smaller or specialized models for high-volume, well-defined tasks where speed and cost matter.
- Many production systems combine both: a small model routes or classifies, a larger model handles the hard cases.

## Key points

- Foundation models are broadly trained and adaptable.
- Adapt them with prompting, then retrieval, then fine-tuning if needed.
- Smaller specialized models often beat large ones on cost and speed for narrow tasks.`,
          },
          {
            type: 'check',
            question: "An assistant must answer questions using company policies that change every month. What should you use first?",
            options: [
              "Fine-tuning the model on this month's policies",
              "Training a new model from scratch on the policies",
              "Retrieval-augmented generation that supplies the current policies with each request",
              "A larger model, because it will already know the policies",
            ],
            answer: 2,
            explanation: "Retrieval keeps changing knowledge current and traceable. Fine-tuning bakes in a snapshot that goes out of date.",
          },
        ],
      },
    ],
  },
  {
    id: "how-llms-generate-responses",
    title: "How LLMs Generate Responses",
    lessons: [
      {
        id: "llm-inference-process",
        title: "Understanding the LLM Inference Process",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Understanding the LLM Inference Process

**Inference** is what happens when a trained model produces an answer. Understanding the steps explains latency, cost, and some of the model's behavior.

## Step by step

1. **Receive the request:** instructions, conversation history, any retrieved documents, and the user's message.
2. **Tokenize:** split the text into tokens.
3. **Process the prompt:** run all input tokens through the network in parallel. This is called the *prefill* stage.
4. **Generate one token:** the model outputs probabilities for every possible next token and one is selected.
5. **Repeat:** the new token is appended and the model generates the next one, until it produces an end token or reaches the maximum length.
6. **Detokenize and return** the text, often streamed to the user as it is produced.

\`\`\`text
Prompt tokens → [model] → next token → append → [model] → next token → …
\`\`\`

## Why this matters

| Observation | Explanation |
| --- | --- |
| Long answers take longer | Output is generated one token at a time |
| Streaming feels faster | Users see the first tokens while the rest are generated |
| Long prompts raise cost | Every input token is processed and billed |
| Output tokens usually cost more | Each one needs its own pass through the model |
| Answers can vary | Token selection involves sampling (next lesson) |

## Measuring speed

- **Time to first token:** how long before the response starts.
- **Tokens per second:** how fast the rest arrives.
- **Total latency:** what the user experiences end to end, including retrieval and your own code.

## Reducing latency

- Keep prompts focused; don't send unnecessary history or documents.
- Set a sensible maximum output length.
- Stream responses in chat interfaces.
- Use a smaller model for simple steps.

## Key points

- Inference processes the prompt, then generates output one token at a time.
- Output length drives latency; input and output tokens drive cost.
- Stream responses and trim prompts to improve the user experience.`,
          },
          {
            type: 'check',
            question: "Why do long answers take longer to generate than short ones?",
            options: [
              "Long answers are always checked by a person before delivery",
              "The model generates output one token at a time, each needing its own step",
              "The model rereads its training data for every sentence",
              "Long answers must be translated before they are returned",
            ],
            answer: 1,
            explanation: "Generation is sequential: each new token requires another pass through the model, so more tokens means more time.",
          },
        ],
      },
      {
        id: "probability-temperature-sampling",
        title: "Probability, Temperature, and Sampling",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Probability, Temperature, and Sampling

At each step an LLM produces a probability for every possible next token. **Sampling settings** decide how one is chosen.

## An example

After "The server is", the model might predict:

| Next token | Probability |
| --- | --- |
| down | 0.42 |
| running | 0.31 |
| overloaded | 0.12 |
| purple | 0.0001 |

Always picking the highest-probability token (**greedy decoding**) gives consistent but sometimes repetitive output. Sampling picks according to the probabilities, which adds variety.

## Temperature

Temperature reshapes the probabilities before sampling:

- **Low (around 0–0.3):** the top tokens dominate. Output is focused and consistent. Good for extraction, classification, and structured data.
- **Medium (around 0.5–0.8):** balanced. Good for most writing and conversation.
- **High (around 1 and above):** flatter probabilities and more surprising choices. Useful for brainstorming; risky for facts.

Even at temperature 0, outputs may vary slightly between calls on some platforms, so don't rely on perfect repetition.

## Other sampling controls

- **Top-p (nucleus sampling):** only consider the smallest set of tokens whose probabilities add up to *p*, such as 0.9.
- **Top-k:** only consider the *k* most likely tokens.
- **Maximum tokens:** caps the output length.
- **Stop sequences:** end generation when a specific string appears.

Change one setting at a time; temperature and top-p interact.

## Choosing settings by task

| Task | Suggested temperature |
| --- | --- |
| Extract fields as JSON | 0–0.2 |
| Classify tickets | 0–0.2 |
| Answer support questions from documents | 0.2–0.5 |
| Draft marketing copy | 0.7–0.9 |
| Brainstorm ideas | 0.9–1.0 |

Some newer models fix or ignore certain sampling settings, so check your provider's documentation.

## Key points

- The model outputs probabilities; sampling selects the next token.
- Low temperature gives consistent output; high temperature gives variety.
- Use low temperature for structured or factual tasks.`,
          },
          {
            type: 'check',
            question: "Which temperature setting suits extracting invoice fields into JSON?",
            options: [
              "A low temperature, around 0 to 0.2",
              "The highest temperature the model allows",
              "Temperature has no effect on structured output",
              "A high temperature, around 1.0",
            ],
            answer: 0,
            explanation: "Extraction needs consistent, predictable output, so a low temperature that favors the most likely tokens is best.",
          },
        ],
      },
      {
        id: "hallucinations-context-grounding",
        title: "Understanding Hallucinations and Context Grounding",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Understanding Hallucinations and Context Grounding

A **hallucination** is output that is false, unsupported by the provided information, or stated with confidence it doesn't deserve: an invented policy, a fake citation, a wrong number.

## Why hallucinations happen

- The model generates **plausible** text, not verified facts.
- It may lack the information, because the facts are private, recent, or obscure.
- The prompt is ambiguous, or asks for something the model can't know.
- High temperature encourages less likely continuations.
- Long or conflicting context can confuse it.

## Grounding

**Grounding** means giving the model trusted information to base its answer on, and instructing it to stay within that information.

\`\`\`text
Answer using only the policy excerpts below.
If the answer is not in the excerpts, say "I can't find that in the policy."
Cite the section number for each statement.

Excerpts:
[Section 4.2] Employees may carry over up to 5 unused vacation days...
\`\`\`

Retrieval-augmented generation (RAG) automates this by searching your documents for relevant passages for every question.

## Other ways to reduce hallucinations

| Technique | Effect |
| --- | --- |
| Ask for citations to the provided sources | Makes claims checkable |
| Allow "I don't know" explicitly | Removes pressure to invent an answer |
| Lower temperature | Fewer unlikely continuations |
| Validate structured output | Catches invalid values and formats |
| Use tools for facts and calculations | Lookups and code are more reliable than recall |
| Human review for high-stakes output | Catches what automation misses |

## Measure it

Build a test set of questions with known answers, including questions the documents *can't* answer, and check how often the system invents something. Re-run it whenever you change prompts, models, or data.

## Key points

- Hallucinations are fluent but unsupported or false output.
- Grounding in trusted sources is the main defence.
- Allow "I don't know", require citations, validate, and measure.`,
          },
          {
            type: 'check',
            question: "Which approach most directly reduces hallucinations about a company's internal policies?",
            options: [
              "Raising the temperature so the model explores more answers",
              "Asking the model to answer from memory with more confidence",
              "Grounding the answer in retrieved policy excerpts and allowing \"I don't know\"",
              "Removing the instructions so the model has fewer constraints",
            ],
            answer: 2,
            explanation: "Supplying trusted excerpts and permitting the model to say it can't find an answer keeps responses tied to real sources.",
          },
        ],
      },
    ],
  },
  {
    id: "tokens-context-windows-model-parameters",
    title: "Tokens, Context Windows, and Model Parameters",
    lessons: [
      {
        id: "understanding-tokens",
        title: "Understanding Tokens and Tokenization",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Understanding Tokens and Tokenization

Language models don't read characters or whole words. They read **tokens**: chunks of text defined by the model's tokenizer.

## What a token can be

- A whole common word: \`server\`
- Part of a word: \`config\` + \`uration\`
- A space plus a word: \` the\`
- Punctuation or a symbol: \`{\`, \`.\`
- Part of a number: \`20\` + \`26\`

For English text, a rough rule of thumb is that **one token is about four characters, or three-quarters of a word**. Other languages, code, and unusual words often use more tokens per word.

## Why tokens matter

| Area | Impact |
| --- | --- |
| **Cost** | Providers bill per input and output token |
| **Context limits** | The context window is measured in tokens |
| **Latency** | More output tokens take longer to generate |
| **Behavior** | Models can struggle with tasks like counting letters, because they see tokens rather than characters |

## Counting tokens

Each model family has its own tokenizer, so the same text can produce different counts. Use the provider's tokenizer library or token-counting endpoint for accurate numbers, especially when you are close to limits.

\`\`\`python
# Rough estimate only; use the provider's tokenizer for exact counts
def estimate_tokens(text: str) -> int:
    return max(1, len(text) // 4)
\`\`\`

## Practical tips

- Don't send whole documents when a relevant excerpt will do.
- Trim long conversation histories or summarize older turns.
- Ask for concise output when you don't need detail.
- Remember that JSON keys, whitespace, and formatting all use tokens.
- Watch the usage figures returned by the API to monitor real costs.

## Key points

- Tokens are the units models read and generate; roughly four characters of English each.
- Tokens drive cost, context limits, and latency.
- Use the provider's tokenizer for exact counts.`,
          },
          {
            type: 'check',
            question: "Why do token counts matter for an AI application's budget?",
            options: [
              "Tokens are a one-time licence fee paid when the model is chosen",
              "Tokens only affect cost when images are included",
              "Providers bill for input and output tokens, so longer prompts and answers cost more",
              "Only the number of requests is billed, not their length",
            ],
            answer: 2,
            explanation: "Most APIs price usage per token, so the length of prompts and responses directly determines cost.",
          },
        ],
      },
      {
        id: "context-windows",
        title: "Understanding Context Windows",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Understanding Context Windows

The **context window** is the maximum number of tokens a model can consider in one request: everything you send **plus** everything it generates.

## What uses the context window

- System and developer instructions.
- Conversation history.
- Retrieved documents or tool results.
- The user's current message.
- The model's response.

\`\`\`text
[instructions][history][documents][user message] + [response] ≤ context window
\`\`\`

If the total exceeds the limit, the request fails or older content must be dropped.

## Bigger isn't automatically better

Context windows have grown from a few thousand tokens to hundreds of thousands or more in some models. Large windows are useful, but:

- **Cost** rises with every token you send.
- **Latency** rises with input size.
- **Quality** can drop: models may overlook details buried in the middle of very long inputs.

Sending only the most relevant information usually gives better and cheaper answers than sending everything.

## Managing context in practice

| Technique | How it helps |
| --- | --- |
| Retrieval (RAG) | Sends only the passages relevant to the question |
| Conversation trimming | Keeps the most recent turns |
| Summarizing history | Replaces old turns with a short summary |
| Chunking long documents | Processes them piece by piece, then combines results |
| Reserving output space | Leaves room for the answer you expect |

## A budgeting example

For a model with a 32,000-token window:

| Part | Budget |
| --- | --- |
| Instructions | 1,000 |
| History | 4,000 |
| Retrieved documents | 20,000 |
| User message | 1,000 |
| Reserved for the answer | 4,000 |
| Safety margin | 2,000 |

## Key points

- The context window covers both the input and the generated output.
- Large windows raise cost and latency, and don't guarantee better answers.
- Send the most relevant content and reserve room for the response.`,
          },
          {
            type: 'check',
            question: "What counts toward a model's context window?",
            options: [
              "The instructions, history, documents, user message, and the generated response",
              "Only the model's response",
              "Only documents retrieved from a database",
              "Only the user's latest message",
            ],
            answer: 0,
            explanation: "The window covers everything the model processes in one request, including the tokens it generates.",
          },
        ],
      },
      {
        id: "model-parameters-architecture",
        title: "Model Parameters, Size, and Capabilities",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Model Parameters, Size, and Capabilities

**Parameters** are the numbers a model learns during training: the weights and biases inside its network. A model's size is usually described by its parameter count, such as 8 billion or 70 billion.

## What size affects

| Larger models tend to | Smaller models tend to |
| --- | --- |
| Handle complex reasoning and instructions better | Respond faster |
| Know more about a wider range of topics | Cost less per token |
| Need more memory and compute | Run on modest hardware, even on-device |
| Respond more slowly | Work well for narrow, well-defined tasks |

Size isn't everything. Training data quality, training methods, and fine-tuning can let a well-trained smaller model beat a larger one on specific tasks.

## Architecture variations

- **Dense models** use all their parameters for every token.
- **Mixture-of-experts (MoE) models** contain many expert sub-networks but only activate a few for each token, giving the capacity of a large model with lower cost per token.
- **Multimodal models** accept images, audio, or video as well as text.
- **Reasoning-focused models** spend extra computation "thinking" before answering, which helps with multi-step problems but adds latency and cost.

## Model settings are not parameters

Don't confuse learned parameters with the **generation settings** you send in a request, such as temperature, top-p, and maximum tokens. Those control how the model generates text, not what it has learned.

## Choosing a size

1. Define the task and the quality bar.
2. Test a small and a large model on realistic examples.
3. Pick the smallest model that meets the quality bar, then consider speed and cost.
4. Re-evaluate when new models are released; capabilities change quickly.

## Key points

- Parameters are learned weights; parameter count describes model size.
- Larger models are more capable but slower and costlier.
- Mixture-of-experts, multimodal, and reasoning models trade capacity, speed, and cost differently.
- Choose the smallest model that meets your quality requirements.`,
          },
          {
            type: 'check',
            question: "What is a reasonable strategy for choosing a model size?",
            options: [
              "Always choose the model with the most parameters",
              "Choose by the number of parameters listed in marketing material",
              "Pick the smallest model that meets the quality bar on realistic tests",
              "Always choose the smallest model to minimize cost",
            ],
            answer: 2,
            explanation: "Testing on your own examples and choosing the smallest model that meets requirements balances quality, speed, and cost.",
          },
        ],
      },
    ],
  },
  {
    id: "ai-model-providers",
    title: "OpenAI and Other Model Providers",
    lessons: [
      {
        id: "understanding-model-providers",
        title: "Understanding AI Model Providers",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Understanding AI Model Providers

Model providers make trained models available through APIs and managed platforms, so you can use them without training or hosting them yourself.

## Types of providers

| Type | Examples | What you get |
| --- | --- | --- |
| **Model developers with APIs** | OpenAI, Anthropic, Google, Mistral, Cohere | Direct API access to their own models |
| **Cloud AI platforms** | Amazon Bedrock, Azure AI Foundry, Google Vertex AI | Several providers' models inside your cloud account, with its security, networking, and billing |
| **Open-weight model sources** | Meta Llama, Mistral, Qwen, others via Hugging Face | Models you can download and run yourself |
| **Inference hosts** | Various specialized platforms | Hosted versions of open-weight models |

The landscape changes quickly: new models and versions appear every few months, and older ones are retired.

## What to compare

- **Quality** on your actual tasks, not only public benchmarks.
- **Price** per input and output token, and any minimum commitments.
- **Speed:** time to first token and throughput.
- **Context window** and supported input types (text, images, audio).
- **Features:** structured outputs, tool calling, batch processing, fine-tuning.
- **Data handling:** whether your data is stored or used for training, data residency, retention.
- **Compliance:** certifications and contractual terms your organization requires.
- **Reliability:** rate limits, uptime commitments, and support.

## Avoiding lock-in

- Wrap model calls in your own service layer instead of calling a provider directly from everywhere.
- Keep prompts, evaluations, and test sets portable.
- Re-run your evaluations when switching models; behavior differs even for the same prompt.

## Key points

- Providers include model developers, cloud platforms, and open-weight model sources.
- Compare quality on your tasks, price, speed, features, and data handling.
- A thin abstraction layer and portable evaluations make switching providers easier.`,
          },
          {
            type: 'check',
            question: "Why might an enterprise access models through a cloud AI platform rather than directly from a model developer?",
            options: [
              "Because cloud platforms guarantee the models never make mistakes",
              "To use the models inside its existing cloud security, networking, and billing",
              "To avoid evaluating models before using them",
              "Because model developers do not offer APIs",
            ],
            answer: 1,
            explanation: "Cloud AI platforms let organizations reach several providers' models while keeping their existing cloud controls and contracts.",
          },
        ],
      },
      {
        id: "hosted-vs-self-hosted-models",
        title: "Hosted Models Versus Self-Hosted Models",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Hosted Models Versus Self-Hosted Models

Organizations can use a model in two broad ways: call a **hosted** model through a provider's API, or **self-host** a model on infrastructure they control.

## Hosted models

The provider runs the model; you send requests over an API.

**Advantages**
- Fast to start: no GPUs or model operations to manage.
- Access to the most capable proprietary models.
- The provider handles scaling, updates, and availability.

**Considerations**
- Data leaves your environment, so review retention, training use, and residency terms.
- Costs grow with usage.
- You depend on the provider's rate limits, pricing, and model retirement schedule.

## Self-hosted models

You run an open-weight model on your own servers or cloud account.

**Advantages**
- Full control over where data is processed.
- Predictable costs at high, steady volume.
- Freedom to customize and fine-tune deeply.

**Considerations**
- You manage GPUs, scaling, monitoring, security patches, and upgrades.
- Open-weight models may trail the best proprietary models on hard tasks.
- Requires specialist skills to run efficiently.

## Comparison

| Factor | Hosted | Self-hosted |
| --- | --- | --- |
| Time to start | Hours | Weeks |
| Operations effort | Low | High |
| Data control | Contractual | Technical |
| Cost at low volume | Low | High (idle GPUs) |
| Cost at very high volume | Can be high | Can be lower |
| Access to frontier models | Yes | Limited to open-weight models |

## A middle path

Cloud AI platforms let you run models inside your cloud account, with private networking and your existing security controls, without operating the model servers yourself. Many enterprises start there.

## Key points

- Hosted models are quick to adopt and the provider runs them; self-hosting gives control but adds operational work.
- Decide based on data requirements, volume, skills, and model quality needs.
- Cloud AI platforms offer a managed option inside your own cloud environment.`,
          },
          {
            type: 'check',
            question: "Which responsibility does an organization take on when it self-hosts a model?",
            options: [
              "Running and maintaining the model's infrastructure, scaling, and updates",
              "Paying the provider per token for every request",
              "Accepting the provider's data retention and usage terms",
              "Waiting for the provider to release model updates",
            ],
            answer: 0,
            explanation: "Self-hosting gives control over data and infrastructure, but the organization must operate everything the provider would otherwise run.",
          },
        ],
      },
      {
        id: "model-selection-strategy",
        title: "Choosing the Right AI Model for an Enterprise",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Choosing the Right AI Model for an Enterprise

There is no single best model. The right choice depends on the task, its quality bar, and constraints such as cost, speed, and data handling.

## Start with the use case

| Use case | What matters most |
| --- | --- |
| Customer support answers | Accuracy grounded in documents, tone, latency |
| Ticket classification | Consistency, low cost at high volume |
| Contract summarization | Long context, accuracy, data protection |
| Code assistance | Coding ability, tool use |
| Internal analytics questions | Reasoning, structured output, access control |

## Define requirements before testing

- **Quality:** what does a good answer look like, and what error rate is acceptable?
- **Latency:** how fast must responses arrive?
- **Volume and budget:** requests per day and cost per request.
- **Context:** how much text each request needs.
- **Data:** confidentiality, residency, and retention requirements.
- **Features:** structured output, tool calling, images, fine-tuning.

## Evaluate with your own data

1. Build a test set of 50–200 realistic examples with expected answers or grading criteria.
2. Run two or three candidate models with the same prompts.
3. Score results with automatic checks where possible, plus human review.
4. Record cost and latency alongside quality.

| Model | Quality score | Avg latency | Cost per 1,000 requests |
| --- | --- | --- | --- |
| Large model A | 92% | 3.1 s | $18.00 |
| Medium model B | 89% | 1.2 s | $4.50 |
| Small model C | 78% | 0.6 s | $0.90 |

If the requirement is 85%, model B may be the best choice.

## Combine models

Many systems route requests: a small model handles simple, frequent cases and escalates harder ones to a larger model.

## Revisit regularly

Models improve and prices drop quickly. Keep your test set and re-run it when new models appear or a provider retires a version.

## Key points

- Choose by use case and explicit requirements, not by leaderboard position.
- Compare candidates on your own examples for quality, latency, and cost.
- Routing between models and regular re-evaluation keep costs and quality in balance.`,
          },
          {
            type: 'check',
            question: "What is the most reliable way to compare candidate models for a business use case?",
            options: [
              "Choose the model ranked highest on public leaderboards",
              "Choose the newest model released by the largest provider",
              "Choose the model with the largest context window",
              "Test them on representative examples from the use case and score quality, latency, and cost",
            ],
            answer: 3,
            explanation: "Public benchmarks don't reflect your data or requirements. Testing on realistic examples shows which model meets your bar at an acceptable cost.",
          },
        ],
      },
    ],
  },
  {
    id: "working-with-llm-apis",
    title: "Working with LLM APIs",
    lessons: [
      {
        id: "llm-api-fundamentals",
        title: "Introduction to LLM APIs",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Introduction to LLM APIs

An LLM API lets your application send text (and sometimes images or files) to a hosted model and receive a generated response.

## Anatomy of a request

| Part | Purpose |
| --- | --- |
| **Endpoint** | The provider's URL for generating responses |
| **API key** | Authenticates your application; sent in a header |
| **Model** | Which model and version to use |
| **Messages or input** | Instructions, conversation history, and the user's message |
| **Settings** | Maximum output tokens, temperature, response format, tools |

Messages usually carry a **role**:

- **System or developer:** instructions that set behavior and rules.
- **User:** the end user's input.
- **Assistant:** earlier model responses in the conversation.

## Anatomy of a response

- The generated text, or structured content such as JSON or tool calls.
- A **stop reason**: finished normally, hit the token limit, or requested a tool.
- **Usage:** input and output token counts, used for cost tracking.
- A request ID, useful when contacting support.

## Stateless by default

Most LLM APIs don't remember earlier requests. To continue a conversation, your application sends the relevant history each time, or uses a provider feature that stores conversation state.

## Errors to handle

| Status | Meaning | Response |
| --- | --- | --- |
| 400 | Invalid request | Fix the request; don't retry unchanged |
| 401 / 403 | Authentication or permission problem | Check keys and access |
| 429 | Rate limit | Wait and retry with backoff |
| 500–503 | Provider problem | Retry with backoff; consider a fallback model |

## Security basics

- Keep API keys on the server, in environment variables or a secret manager.
- Never expose a privileged key in a browser or mobile app.
- Log usage, but don't log sensitive prompt content unnecessarily.

## Key points

- Requests specify the model, role-tagged messages, and settings; responses include text, stop reason, and usage.
- APIs are usually stateless, so you send the conversation history.
- Keep keys server-side and handle rate limits and errors.`,
          },
          {
            type: 'check',
            question: "Where should an application store the API key for an LLM provider?",
            options: [
              "In the frontend environment file shipped to browsers",
              "In backend configuration such as environment variables or a secrets manager",
              "In the browser's local storage after sign-in",
              "In the source code so every developer has it",
            ],
            answer: 1,
            explanation: "Keys must stay on the server. Anything shipped to a browser or committed to code can be extracted and misused.",
          },
        ],
      },
      {
        id: "python-llm-api-integration",
        title: "Connecting Python Applications to LLM APIs",
        minutes: 9,
        blocks: [
          {
            type: 'text',
            text: `# Connecting Python Applications to LLM APIs

Python applications call LLMs either through the provider's **SDK** or with plain HTTP requests. SDKs handle authentication, retries, and response parsing for you.

## Typical setup

\`\`\`bash
pip install <provider-sdk> python-dotenv
\`\`\`

Store the key in an environment variable, never in code:

\`\`\`bash
export MODEL_API_KEY="..."
\`\`\`

## A provider-neutral service function

Each provider's SDK differs slightly, so wrap calls in one function your application uses everywhere:

\`\`\`python
import os
import requests

API_URL = os.environ["MODEL_API_URL"]
API_KEY = os.environ["MODEL_API_KEY"]
MODEL = os.environ.get("MODEL_NAME", "example-model")

class ModelError(Exception):
    pass

def generate(instructions: str, user_message: str, max_tokens: int = 500) -> str:
    payload = {
        "model": MODEL,
        "max_tokens": max_tokens,
        "messages": [
            {"role": "system", "content": instructions},
            {"role": "user", "content": user_message},
        ],
    }
    try:
        response = requests.post(
            API_URL,
            json=payload,
            headers={"Authorization": f"Bearer {API_KEY}"},
            timeout=60,
        )
        response.raise_for_status()
    except requests.exceptions.RequestException as error:
        raise ModelError(f"Model request failed: {error}") from error

    data = response.json()
    return extract_text(data)   # provider-specific parsing in one place
\`\`\`

The field names in the payload and response vary by provider; check their documentation and keep the differences inside this one module.

## Good practices

- **Timeouts** on every call; generation can take tens of seconds.
- **Retries with backoff** for 429 and 5xx errors only.
- **Log** model name, token usage, latency, and errors.
- **Limit input size** before sending it.
- **Validate output** before using it.
- **Test** your code with a fake \`generate()\` so unit tests don't call the real API.

## Async for many requests

When processing many items, asynchronous calls or the provider's batch API improve throughput. Respect rate limits by limiting concurrency.

## Key points

- Use the provider SDK or HTTP, with the key in the environment.
- Wrap model calls in one service function so the rest of the code doesn't depend on a provider.
- Add timeouts, selective retries, logging, and output validation.`,
          },
          {
            type: 'check',
            question: "Why wrap all model calls in a single service function such as generate()?",
            options: [
              "So the API key can be passed to the browser more easily",
              "Because it removes the need for timeouts and error handling",
              "Because model APIs only accept requests from functions named generate",
              "So provider-specific details stay in one place and the rest of the code is easy to test and change",
            ],
            answer: 3,
            explanation: "A single wrapper isolates SDK and payload differences, makes testing with a fake easy, and simplifies switching providers.",
          },
        ],
      },
      {
        id: "llm-structured-outputs-tools",
        title: "Structured Outputs and Tool Calling",
        minutes: 7,
        blocks: [
          {
            type: 'text',
            text: `# Structured Outputs and Tool Calling

Applications often need model output they can process reliably, not free-form prose. Two features help: **structured outputs** and **tool calling**.

## Structured outputs

You ask the model to return data in a defined format, usually JSON that matches a schema:

\`\`\`json
{
  "type": "object",
  "properties": {
    "category": {"type": "string", "enum": ["Hardware", "Software", "Access"]},
    "priority": {"type": "integer", "minimum": 1, "maximum": 4},
    "summary": {"type": "string"}
  },
  "required": ["category", "priority", "summary"]
}
\`\`\`

Many providers can **enforce** a schema so the response always parses. Even then, validate the values: a valid category can still be the wrong one.

\`\`\`python
import json

result = json.loads(model_text)
if result["category"] not in {"Hardware", "Software", "Access"}:
    raise ValueError("Unexpected category")
\`\`\`

## Tool calling

With tool calling (also called function calling), you describe functions the model may request, such as \`look_up_order(order_id)\`. The flow:

1. Your app sends the user's message plus tool descriptions.
2. The model replies with a **tool call**: the tool name and JSON arguments.
3. **Your code** validates the arguments, checks the user is allowed, and runs the function.
4. You send the result back; the model writes the final answer.

The model never runs code itself. Your application stays in control.

## Safety rules for tools

- Give each tool the narrowest permissions possible.
- Validate every argument on the server.
- Check the **user's** authorization, not just that the model asked.
- Require confirmation for actions that change data or spend money.
- Log every tool call.

## When to use which

| Need | Use |
| --- | --- |
| Extract or classify into fixed fields | Structured outputs |
| Look up live data or take an action | Tool calling |
| Both: decide, then act | Tool calling with structured arguments |

## Key points

- Structured outputs return JSON that matches a schema; still validate the values.
- Tool calling lets the model request functions that your code runs.
- Enforce permissions and validation in your code, not in the prompt.`,
          },
          {
            type: 'check',
            question: "In tool calling, who actually executes the requested function?",
            options: [
              "The application's own code, after validating the arguments and permissions",
              "The model provider's database",
              "The language model, directly on the provider's servers",
              "The end user's browser",
            ],
            answer: 0,
            explanation: "The model only proposes a call. Your application decides whether to run it, validates it, and executes it.",
          },
        ],
      },
    ],
  },
  {
    id: "model-evaluation-performance",
    title: "Model Evaluation and Performance",
    lessons: [
      {
        id: "evaluating-model-quality",
        title: "Evaluating AI Model Quality",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Evaluating AI Model Quality

A demo that works on five examples proves very little. **Evaluation** measures how well an AI feature performs across realistic cases, and keeps measuring as prompts, models, and data change.

## Build an evaluation set

Collect examples that represent real use:

- Common requests.
- Edge cases: ambiguous, incomplete, very long, or unusual inputs.
- Questions the system **shouldn't** answer, or where it should say "I don't know".
- Known past failures.

For each, record the expected answer or the criteria a good answer must meet.

## Ways to score

| Method | Good for | Watch out for |
| --- | --- | --- |
| **Exact or rule-based checks** | Classification, extraction, JSON validity | Only works when answers are well defined |
| **Reference comparison** | Answers with a known correct version | Different wording can still be correct |
| **Model-graded (LLM as judge)** | Scaling review of open-ended answers | Needs its own validation against human judgment |
| **Human review** | Nuanced quality, tone, safety | Slow and costly; use a clear rubric |
| **User feedback** | Real-world satisfaction | Biased toward users who respond |

## What to measure

- **Correctness:** is the answer right?
- **Groundedness:** is it supported by the provided sources?
- **Completeness and relevance:** does it answer the actual question?
- **Format:** does it follow the required structure?
- **Safety:** does it avoid harmful or disallowed content and protect data?
- **Consistency:** similar inputs, similar quality.

## Make it a habit

1. Run the evaluation before every change to prompts, models, or retrieval.
2. Compare against the previous version, not just an absolute score.
3. Add new failures from production to the set.

This is **regression testing for AI**: it stops an improvement in one area from quietly breaking another.

## Key points

- Evaluate on a realistic set that includes edge cases and unanswerable questions.
- Combine automatic checks, model grading, and human review.
- Re-run evaluations on every change and grow the set from real failures.`,
          },
          {
            type: 'check',
            question: "Why should an evaluation set include questions the system should not answer?",
            options: [
              "Because models answer those questions faster",
              "To make the overall score look higher",
              "To reduce the number of examples that need human review",
              "To check that the system admits it doesn't know instead of inventing an answer",
            ],
            answer: 3,
            explanation: "Unanswerable questions test whether the system hallucinates. A trustworthy system declines or says it can't find the answer.",
          },
        ],
      },
      {
        id: "llm-performance-latency-cost",
        title: "Model Performance, Latency, and Cost",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Model Performance, Latency, and Cost

Production AI features must be good enough, fast enough, and affordable at scale. These goals pull against each other, so you manage them together.

## Key metrics

| Metric | Meaning |
| --- | --- |
| **Latency** | Time from request to complete response |
| **Time to first token** | Time until the response starts appearing |
| **Throughput** | Requests or tokens processed per second |
| **Cost per request** | Input tokens × input price + output tokens × output price |
| **Error rate** | Share of requests that fail or time out |

## Estimating cost

\`\`\`text
Requests per day:        20,000
Average input tokens:    1,500
Average output tokens:   300
Input price:             $1.00 per million tokens
Output price:            $4.00 per million tokens

Daily input cost  = 20,000 × 1,500 / 1,000,000 × $1.00 = $30.00
Daily output cost = 20,000 × 300   / 1,000,000 × $4.00 = $24.00
Daily total       = $54.00, about $1,620 per month
\`\`\`

Prices here are illustrative; check current provider pricing.

## Levers to improve speed and cost

- **Right-size the model:** use a smaller model where quality allows.
- **Trim prompts:** send only relevant context and history.
- **Cap output length** and ask for concise answers.
- **Cache** answers to repeated questions, and use provider prompt caching for repeated instructions.
- **Batch** non-urgent work through batch APIs, often at a discount.
- **Route** simple requests to cheap models and hard ones to capable models.
- **Stream** responses so users see progress immediately.

## Plan for limits

- Providers enforce rate limits on requests and tokens per minute.
- Queue and throttle background jobs.
- Set budgets and alerts so a bug or traffic spike doesn't create a surprise bill.

## Key points

- Track latency, throughput, cost per request, and errors.
- Cost scales with tokens, so prompt size and output length matter.
- Right-sizing, trimming, caching, batching, and routing keep performance and cost in balance.`,
          },
          {
            type: 'check',
            question: "Which change usually reduces both cost and latency without changing the model?",
            options: [
              "Raising the temperature to generate answers faster",
              "Removing timeouts from API calls",
              "Sending only the relevant context instead of whole documents and long histories",
              "Increasing the maximum output tokens",
            ],
            answer: 2,
            explanation: "Fewer input tokens are cheaper and faster to process. Temperature doesn't speed generation, and higher token limits add cost.",
          },
        ],
      },
      {
        id: "responsible-ai-model-monitoring",
        title: "Responsible AI and Model Monitoring",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Responsible AI and Model Monitoring

Responsible AI means designing and operating AI systems so they are safe, fair, private, transparent, and accountable. It continues after launch through monitoring.

## Core principles

| Principle | In practice |
| --- | --- |
| **Safety** | Prevent harmful outputs and unsafe actions |
| **Fairness** | Check that quality doesn't differ unfairly across groups of users |
| **Privacy** | Minimize personal data sent to models; control retention |
| **Transparency** | Tell users when they are interacting with AI and how it is used |
| **Accountability** | Name owners, keep records, and provide a way to report problems |
| **Human oversight** | Keep people in the loop for consequential decisions |

## Risks specific to LLMs

- Hallucinated facts presented confidently.
- Prompt injection: instructions hidden in user input or documents that try to override your rules.
- Leakage of confidential data in responses.
- Biased or inappropriate content.
- Over-reliance: users trusting output without checking it.

## What to monitor in production

- **Quality:** sampled reviews, user feedback, and automated evaluation scores over time.
- **Safety:** flagged or blocked content, injection attempts.
- **Operational health:** latency, error rates, timeouts, rate limits.
- **Cost:** token usage by feature and by customer.
- **Drift:** changes in the kinds of questions users ask, or in model behavior after a provider update.

## Responding to problems

1. Define thresholds and alerts for each metric.
2. Keep an incident process: who investigates, who can disable a feature.
3. Version prompts and configurations so you can roll back.
4. Add every incident to your evaluation set.

## Governance

Document each AI system: its purpose, data sources, model, known limitations, evaluation results, and owner. Regulations and internal policies increasingly require this.

## Key points

- Responsible AI covers safety, fairness, privacy, transparency, accountability, and oversight.
- Monitor quality, safety, operations, cost, and drift after launch.
- Version configurations, alert on thresholds, and feed incidents back into evaluation.`,
          },
          {
            type: 'check',
            question: "Why must AI features be monitored after launch, even if they passed evaluation?",
            options: [
              "Evaluation results are only valid for the first hour after deployment",
              "User behavior, data, and provider models change over time, which can lower quality",
              "Monitoring replaces the need for evaluation before launch",
              "Providers require monitoring before they release model updates",
            ],
            answer: 1,
            explanation: "Real usage and model updates drift away from what was tested, so ongoing monitoring catches problems evaluation couldn't foresee.",
          },
        ],
      },
    ],
  },
  {
    id: "practical-ai-engineering-project",
    title: "Practical AI Engineering Project",
    lessons: [
      {
        id: "designing-an-ai-application",
        title: "Project: Designing an AI-Powered Application",
        minutes: 7,
        blocks: [
          {
            type: 'text',
            text: `# Project: Designing an AI-Powered Application

In this project you design the **Zebron Enterprise Assistant**, an assistant that answers employee questions about internal processes and services.

## Business requirement

Employees spend time searching intranet pages and waiting for help-desk replies. The assistant should:

- Accept natural-language questions.
- Answer from approved internal content, with sources.
- Return structured results where the request needs them, such as a ticket draft.
- Respect each employee's access permissions.
- Protect confidential and personal information.

## Proposed architecture

\`\`\`text
Angular frontend
   ↓  HTTPS, signed-in user
Python backend API (FastAPI)
   ├─ Authentication and authorization
   ├─ Input validation and rate limits
   ├─ Retrieval of approved documents the user may see
   ├─ LLM integration service (provider SDK, timeouts, retries)
   ├─ Output validation
   └─ Logging and monitoring
   ↓
AI model provider
\`\`\`

The backend owns the API credentials and all business rules. The browser never calls the model provider directly.

## Document before you build

| Item | Example decision |
| --- | --- |
| Users | All employees; HR content limited to HR staff |
| Use cases | Policy questions, IT how-to, ticket drafting |
| Out of scope | Legal advice, salary data, actions in HR systems |
| Quality bar | 90% correct on a 100-question evaluation set |
| Latency | First token under 2 seconds; full answer under 10 |
| Data handling | No personal data in prompts; 30-day log retention |
| Model choice | Medium model; re-evaluate quarterly |
| Budget | Under $500 per month at 2,000 questions per day |

## Risks to plan for

- Answers that sound right but aren't: ground answers and show sources.
- Users seeing content they shouldn't: filter retrieval by permissions.
- Prompt injection from documents: treat retrieved text as data, not instructions.

## Key points

- Start from the business problem, users, scope, and success measures.
- Keep credentials, permissions, and validation in the backend.
- Record decisions on quality, latency, data, model, and budget before building.`,
          },
          {
            type: 'check',
            question: "In the proposed architecture, why does the frontend call the backend instead of the model provider?",
            options: [
              "The backend protects the API credentials and enforces permissions and validation",
              "Calling the provider directly would make answers less accurate",
              "Model providers only accept requests from Angular applications",
              "The backend is required to translate questions into another language",
            ],
            answer: 0,
            explanation: "Routing through the backend keeps keys secret and gives one controlled place for authorization, validation, and logging.",
          },
        ],
      },
      {
        id: "building-an-ai-api",
        title: "Project: Building an AI-Powered Python API",
        minutes: 8,
        blocks: [
          {
            type: 'text',
            text: `# Project: Building an AI-Powered Python API

The next step is a backend endpoint that the frontend calls to ask the assistant a question.

## The endpoint

\`\`\`text
POST /api/v1/assistant/chat
\`\`\`

Request:

\`\`\`json
{"message": "How do I request a new laptop?"}
\`\`\`

Response:

\`\`\`json
{
  "answer": "Submit a Hardware Request in the IT portal...",
  "sources": [{"title": "IT Equipment Policy", "section": "3.1"}],
  "model": "selected-model",
  "status": "completed"
}
\`\`\`

## A FastAPI sketch

\`\`\`python
from fastapi import Depends, FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI()

class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)

class ChatResponse(BaseModel):
    answer: str
    sources: list[dict]
    model: str
    status: str

@app.post("/api/v1/assistant/chat", response_model=ChatResponse)
def chat(request: ChatRequest, user=Depends(current_user)):
    enforce_rate_limit(user)
    passages = search_documents(request.message, allowed_for=user)
    try:
        reply = generate_answer(request.message, passages)
    except ModelError:
        raise HTTPException(status_code=503, detail="The assistant is unavailable. Try again shortly.")
    log_usage(user, reply)
    return ChatResponse(answer=reply.text, sources=reply.sources, model=reply.model, status="completed")
\`\`\`

\`current_user\`, \`search_documents\`, \`generate_answer\`, and \`log_usage\` are your own functions. Pydantic validates the request size and shape automatically.

## Checklist

- **Authentication:** every request comes from a signed-in user.
- **Authorization:** retrieval only returns documents the user may see.
- **Validation:** limit message length; validate model output.
- **Resilience:** timeouts, retries for temporary errors, a clear message on failure.
- **Limits:** per-user rate limits protect budget and availability.
- **Observability:** log latency, tokens, errors, and model version, without storing sensitive text unnecessarily.
- **Tests:** unit tests with a fake model, plus the evaluation set from earlier lessons.

## Key points

- Expose AI through a validated, authenticated backend endpoint.
- Filter retrieved content by the user's permissions before it reaches the model.
- Handle failures gracefully and log what you need to operate the service.`,
          },
          {
            type: 'check',
            question: "Why does the endpoint pass the user to search_documents(..., allowed_for=user)?",
            options: [
              "To make the search run faster for frequent users",
              "Because FastAPI requires a user for every function call",
              "So the model can greet the user by name",
              "So retrieval only returns documents the user is permitted to see",
            ],
            answer: 3,
            explanation: "Filtering retrieval by permissions prevents the assistant from revealing content the user isn't allowed to access.",
          },
        ],
      },
      {
        id: "ai-engineering-capstone",
        title: "Final Assessment: AI Engineering Fundamentals",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Final Assessment: AI Engineering Fundamentals

Congratulations on completing AI Engineering Fundamentals and Large Language Models. Use this review to confirm you can explain each area in your own words.

## Concept review

| Area | You should be able to explain |
| --- | --- |
| **AI, ML, deep learning** | How they nest, and when each fits a problem |
| **Learning approaches** | Supervised, unsupervised, self-supervised, reinforcement |
| **Neural networks** | Layers, weights, activations, and the training loop |
| **Transformers** | Attention, and why decoder-only models generate text |
| **LLMs** | Pretraining, instruction tuning, alignment, and limitations |
| **Inference** | Tokenization, next-token generation, sampling, temperature |
| **Context** | Tokens, context windows, and managing what you send |
| **Providers** | Hosted versus self-hosted, comparing providers, avoiding lock-in |
| **APIs** | Requests, roles, errors, structured outputs, tool calling |
| **Evaluation** | Test sets, scoring methods, regression testing |
| **Operations** | Latency, cost, monitoring, and responsible AI |

## Scenario practice

For each scenario, decide what you would do and why:

1. A support assistant sometimes invents refund rules. *(Ground answers in policy documents, allow "I don't know", evaluate with unanswerable questions.)*
2. A classification feature costs too much at 500,000 requests a day. *(Test a smaller model, trim prompts, batch, and cache.)*
3. Developers want to call the model directly from the browser to save time. *(Refuse: keys and permissions belong in the backend.)*
4. A provider announces a new model version. *(Re-run the evaluation set before switching.)*

## Engineering mindset

- The model is one component; validation, permissions, and monitoring make it safe to use.
- Measure quality instead of judging by a few demos.
- Choose the simplest model and design that meet the requirements.

## What comes next

The next courses build on this foundation: prompt engineering and structured outputs, embeddings and retrieval-augmented generation, and AI agents that use tools.

## Key points

- Review every concept area and practise applying it to scenarios.
- Treat the model as one part of a secure, measured, maintainable system.`,
          },
          {
            type: 'check',
            question: "A provider releases a new model version. What should you do before switching production to it?",
            options: [
              "Re-run your evaluation set and compare results with the current model",
              "Switch only if the new model has a larger context window",
              "Ask the model whether it is better than the previous version",
              "Switch immediately, because newer models are always better",
            ],
            answer: 0,
            explanation: "Behavior changes between versions. Re-running your evaluations shows whether the new model meets your requirements before users depend on it.",
          },
        ],
      },
    ],
  },
];

runCourseSeed({ course: COURSE, modules: MODULES, script: 'scripts/ai-engineering/seed-ai-engineering-fundamentals.mjs' }).catch((error) => {
  console.error('\nSEED FAILED:', error);
  process.exit(1);
});
