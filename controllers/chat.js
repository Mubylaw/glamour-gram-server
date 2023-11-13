const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const User = require("../models/User");
const { JSONLoader } = require("langchain/document_loaders/fs/json");
const { CharacterTextSplitter } = require("langchain/text_splitter");
const { OpenAIEmbeddings } = require("langchain/embeddings/openai");
const { FaissStore } = require("langchain/vectorstores/faiss");
const { OpenAI } = require("langchain/llms/openai");
const { RetrievalQAChain, loadQAStuffChain } = require("langchain/chains");
const { BufferMemory } = require("langchain/memory");
const {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
  MessagesPlaceholder,
} = require("langchain/prompts");
const fs = require("fs");
const path = require("path");
const model = new OpenAI({ temperature: 0 });
const userMemories = new Map();

// @desc    Create Vector store
// @route   POST /api/v1/chat/store
// @access  Private / admin
exports.createVectorStore = asyncHandler(async (req, res, next) => {
  const business = await User.findById(req.body.biz);

  if (!business) {
    return next(
      new ErrorResponse(`Business not found with id of ${req.body.biz}`, 404)
    );
  }

  const tempFilePath = path.join(__dirname, "../temp.json");

  fs.writeFileSync(tempFilePath, JSON.stringify(business));

  const faissIndexPath = `./faiss_index_${req.body.biz}`;

  const loader = new JSONLoader("./temp.json");

  const docs = await loader.load();

  const splitter = new CharacterTextSplitter({
    chunkSize: 200,
    chunkOverlap: 50,
  });

  const documents = await splitter.splitDocuments(docs);

  try {
    const embeddings = new OpenAIEmbeddings();
    const vectorstore = await FaissStore.fromDocuments(documents, embeddings);
    await vectorstore.save(faissIndexPath);
    fs.unlinkSync(tempFilePath);
  } catch (error) {
    console.error("Error:", error);
  }

  res.status(200).json({
    success: true,
    data: "vector store created",
  });
});

// @desc    Ask Question
// @route   POST /api/v1/chat
// @access  Private / admin
exports.askQuestion = asyncHandler(async (req, res, next) => {
  const embeddings = new OpenAIEmbeddings();
  const faissIndexPath = `./faiss_index_${req.body.biz}`;
  const vectorStore = await FaissStore.load(faissIndexPath, embeddings);

  // Create or retrieve user memory
  let userMemory = userMemories.get(req.user.id);
  if (!userMemory) {
    userMemory = new BufferMemory({
      returnMessages: true,
      memoryKey: req.user.id,
      inputKey: "query",
      outputKey: "text",
    });
    userMemories.set(req.user.id, userMemory);
  }

  // Your model and vectorStore setup
  const combineDocumentsChain = loadQAStuffChain(model);
  const retriever = vectorStore.asRetriever();

  const chatPrompt = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(
      "The following is a friendly conversation between a human and an AI. The AI is here to assist you with any questions you may have about businesses on our site. It can provide specific details and information. If the AI doesn't have the answer, it will truthfully mention that it doesn't know. Feel free to ask anything!"
    ),
    HumanMessagePromptTemplate.fromTemplate("{query}"),
  ]);

  // Create the combined chain with memory
  const combinedChain = new RetrievalQAChain({
    combineDocumentsChain,
    retriever,
    returnSourceDocuments: true,
    memory: userMemory,
    prompt: chatPrompt,
  });

  // Ask a question and get a response
  const response = await combinedChain.call({
    query: req.body.question,
  });

  res.status(200).json({
    success: true,
    data: response,
  });
});
