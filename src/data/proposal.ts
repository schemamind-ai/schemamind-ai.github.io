// Public text of the project proposal. The description paragraphs are copied
// verbatim from the original proposal; only the student numbers are omitted.

export const proposalDescription = [
  'Our project focuses on training a large language model (LLM) to understand SQL database structures and generate queries based on natural language questions. Normally, language models need information about database tables and columns each time they generate a query. We want to see how much of this information a model can actually learn during training.',
  'We will use an open-source language model and fine-tune it with SQL queries, database schemas, and examples of how tables are related. We plan to try different training approaches, including LoRA and QLoRA, and compare their results to find out which approach works better.',
  'Another part of our project is to test what happens when a database changes after the model has been trained. For example, if a table or column is renamed, we want to see whether the model can still generate correct SQL queries and whether providing updated schema information can help.',
  'We will test our models using SQL datasets such as BIRD and compare their performance with methods that provide database information directly to the model. Our goal is to understand when fine-tuning is useful, what its limitations are, and how models can handle changes in database structures. We also plan to build an application to demonstrate our results.',
] as const;
