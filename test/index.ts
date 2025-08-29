// // import { OpenAI } from "openai/client.js";
// // const openai = new OpenAI({
// //   apiKey: process.env.OPEN_AI_KEY
// // });

// async function main() {
//  const messages = [
//     {
//         role: "system",
//         content: "You are a helpful assistant that gives information about the transport service of a company.",
//     },
//     {
//         role: "system",
//         content: "What is the maximum transport fare?"
//     }
//  ]

//   const completion = await openai.chat.completions.create({
//     model: "gpt-4.1-nano-2025-04-14",
//     messages,
//     tools,
//   })

//   console.log(completion.choices[0]);
// }

// main();

import { OpenAI } from "openai";
import dotenv from "dotenv";
import { describe } from "node:test";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPEN_API_KEY,
});

function getTimeOfDay() {
  return "4:56";
}

function getOrderStatus(orderId: string) {
  console.log(`Getting the status of order ${orderId}`);
  const orderAsNumber = parseInt(orderId);
  if (orderAsNumber % 2 === 0) {
    return "IN PROGRESS";
  }
  return "COMPLETED";
}

async function callOpenAIWithTools() {
  const context: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content:
        "You are a helpful assistant that gives information about the time of day and order status.",
    },
    {
      role: "user",
      content: "What is the status of order 1235?",
    },
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-nano-2025-04-14",
    messages: context,
    tools: [
      {
        type: "function",
        function: {
          name: "getTimeOfDay",
          description: "Get the time of day",
        },
      },
      {
        type: "function",
        function: {
          name: "getOrderStatus",
          description: "Return the state of the order",
          parameters:{
            type: 'object',
            properties: {
              orderId: {
                type: 'string',
                description: 'The id of the order to get the status of'
              }
            },
            required: ['orderId'],
          }
        }
      },
    ],
    tool_choice: "auto",
  });
  const willInvokeFunction = response.choices[0].finish_reason == "tool_calls";
  const toolcall = response.choices[0].message.tool_calls![0];

  if (willInvokeFunction) {
    if (toolcall.type === "function") {
      const toolName = toolcall.function.name;
      if (toolName == "getTimeOfDay") {
        const toolResponse = getTimeOfDay();
        context.push(response.choices[0].message);
        context.push({
          role: "tool",
          content: toolResponse,
          tool_call_id: toolcall.id,
        });
      }
    }
    if (toolcall.type === "function") {
      const toolName = toolcall.function.name;
      if (toolName == "getOrderStatus") {
        const rawArgument = toolcall.function.arguments;
        const parsedArgument = JSON.parse(rawArgument);
        const toolResponse = getOrderStatus(parsedArgument.orderId);
        context.push(response.choices[0].message);
        context.push({
          role: "tool",
          content: toolResponse,
          tool_call_id: toolcall.id,
        });
      }
    }
  }

  const secondResponse = await openai.chat.completions.create({
    model: "gpt-4.1-nano",
    messages: context,
  });

  console.log(secondResponse.choices[0].message.content);
}

callOpenAIWithTools();
