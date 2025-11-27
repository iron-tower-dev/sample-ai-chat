# AI Chat Assistant - User Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Interface Overview](#interface-overview)
3. [Starting a Conversation](#starting-a-conversation)
4. [Managing Conversations](#managing-conversations)
5. [Document Sources and Filters](#document-sources-and-filters)
6. [Message Features](#message-features)
7. [Customizing Your Experience](#customizing-your-experience)
8. [Tips and Best Practices](#tips-and-best-practices)

---

## Getting Started

### What is AI Chat Assistant?
AI Chat Assistant is an intelligent conversational interface that helps you find information from various document sources. It uses advanced AI to understand your questions and provide contextual answers with citations from relevant documents.

### First Time Setup
1. Launch the application in your web browser
2. The system will automatically detect your theme preference (light/dark mode)
3. You'll see the main chat interface ready to use

**[SCREENSHOT SUGGESTION: Home page showing empty chat interface with sidebar]**

---

## Interface Overview

The application consists of three main areas:

### 1. Top Toolbar
- **Application Title**: Displays "AI Chat Assistant"
- **Menu Button** (☰): Toggle the conversation sidebar
- **Theme Button**: Change between light, dark, and system themes

**[SCREENSHOT SUGGESTION: Top toolbar with buttons labeled]**

### 2. Conversation Sidebar (Left Panel)
- View all your previous conversations
- Create new conversations
- Switch between conversations
- Delete conversations you no longer need

**[SCREENSHOT SUGGESTION: Sidebar showing multiple conversations]**

### 3. Main Chat Area (Center)
- **Message Display**: Shows the conversation history
- **Input Box**: Type your questions here
- **Send Button**: Submit your message
- **Document Selector**: Choose which documents to search
- **Model Selector**: Select the AI model (if multiple are available)

**[SCREENSHOT SUGGESTION: Main chat area with labeled components]**

---

## Starting a Conversation

### Creating a New Conversation
1. Click the **"+"** button in the conversation sidebar
2. A new conversation will be created automatically
3. The first message you send will determine the conversation title

### Sending Your First Message
1. Type your question in the input box at the bottom of the screen
2. Click the **Send** button or press **Enter**
3. The AI will process your question and provide a response
4. Responses include citations from relevant documents

**[SCREENSHOT SUGGESTION: Chat input box with a sample question typed in]**

### Understanding Responses

AI responses may include:

- **Main Answer**: The AI's response to your question
- **Thinking Process**: (expandable) Shows how the AI reasoned about your question
- **Tool Actions**: (expandable) Shows what tools or searches were performed
- **Citations**: Links to source documents used in the answer
- **Follow-up Questions**: Suggested related questions you can ask

**[SCREENSHOT SUGGESTION: A complete AI response showing citations and expandable sections]**

---

## Managing Conversations

### Viewing Conversations
- All conversations appear in the left sidebar
- Click any conversation to open it
- The active conversation is highlighted
- Conversations show their title and last update time

**[SCREENSHOT SUGGESTION: Sidebar with multiple conversations, one highlighted]**

### Deleting Conversations
1. Hover over a conversation in the sidebar
2. Click the **delete icon** (🗑️) that appears
3. Confirm the deletion
4. The conversation and all its messages will be permanently removed

### Conversation Persistence
- Conversations are automatically saved to your browser
- When you return to the application, your conversations will still be available
- Clearing your browser data will remove saved conversations

---

## Document Sources and Filters

### Selecting Document Sources
1. Click the **Document Selector** button in the chat interface
2. A dialog will show available document sources
3. Check the sources you want to search
4. Sources may be:
   - **External**: Publicly available documents
   - **Internal**: Restricted to authorized users

**[SCREENSHOT SUGGESTION: Document selector dialog showing multiple sources with checkboxes]**

### Applying Metadata Filters
1. In the Document Selector dialog, expand a document source
2. You'll see available metadata fields (Author, Category, Tags, etc.)
3. Select specific values to narrow your search
4. For example, filter by:
   - Specific authors
   - Document categories
   - Date ranges
   - Custom tags

**[SCREENSHOT SUGGESTION: Document source expanded showing metadata filter options]**

### Understanding Authorization
- Some document sources require specific permissions
- Internal documents are only available if you're in authorized Active Directory groups
- If you don't see a source, you may not have access to it

---

## Message Features

### Message Feedback
You can rate AI responses to help improve the system:

1. **Thumbs Up** (👍): The response was helpful
2. **Thumbs Down** (👎): The response wasn't helpful
   - A dialog will appear asking for optional feedback
   - Provide details about what was wrong or missing

**[SCREENSHOT SUGGESTION: Message with thumbs up/down buttons visible]**

### Viewing Citations
- Citations appear as linked document references in responses
- Hover over a citation to see a preview
- Click a citation to view more details about the source document
- Citations show:
  - Document title
  - Page numbers
  - Relevance score
  - Metadata (author, category, etc.)

**[SCREENSHOT SUGGESTION: Citation link with hover preview showing document details]**

### Mathematical Content
The application supports mathematical notation:
- **Inline math**: Wrapped in single dollar signs `$x^2 + y^2 = z^2$`
- **Display math**: In code blocks marked as `latex` or `math`
- Math is rendered using KaTeX for clear, professional display

**[SCREENSHOT SUGGESTION: Message showing rendered mathematical equations]**

### Code Blocks
- Code is displayed with syntax highlighting
- Code blocks preserve formatting
- You can copy code snippets for use elsewhere

**[SCREENSHOT SUGGESTION: Message with code block showing syntax highlighting]**

---

## Customizing Your Experience

### Changing Themes

The application supports three theme modes:

1. **Light Mode**: Bright background, ideal for well-lit environments
2. **Dark Mode**: Dark background, easier on the eyes in low light
3. **System Mode**: Automatically matches your operating system's theme

To change themes:
1. Click the **Theme** button in the top toolbar
2. Select your preferred theme from the dialog
3. The change applies immediately

**[SCREENSHOT SUGGESTION: Theme selector dialog showing all three options]**

### Model Selection
If multiple AI models are available:
1. Click the **Model Selector** in the chat interface
2. Choose the model that best fits your needs
3. Different models may have different capabilities or speed

---

## Tips and Best Practices

### Asking Effective Questions
- **Be specific**: "What are the safety requirements for electrical work?" is better than "Tell me about safety"
- **Provide context**: Mention relevant details like document types or specific areas
- **Use follow-ups**: Build on previous answers with follow-up questions

### Working with Document Sources
- **Select relevant sources**: Fewer, targeted sources often give better results than selecting everything
- **Use filters**: Narrow down by date, author, or category for more precise answers
- **Check authorization**: Make sure you have access to the documents you need

### Managing Your Workspace
- **Create separate conversations**: Keep different topics in different conversations for easier reference
- **Delete old conversations**: Remove conversations you no longer need to keep things organized
- **Review citations**: Always check source documents for complete context

### Providing Feedback
- **Rate responses**: Your feedback helps improve the AI
- **Be specific in comments**: When giving negative feedback, explain what was missing or incorrect
- **Report issues**: If you encounter problems, provide details to help with troubleshooting

### Performance Tips
- **Clear filters**: Too many restrictive filters might limit available documents
- **Be patient**: Complex questions may take a few moments to process
- **Break down complex topics**: Ask multiple focused questions rather than one very broad question

---

## Troubleshooting

### Common Issues

**No responses appearing**
- Check your internet connection
- Verify you have document sources selected
- Try refreshing the browser

**Can't see certain documents**
- You may not have authorization for internal documents
- Contact your administrator about access

**Conversations not saving**
- Check that cookies and local storage are enabled in your browser
- Make sure you're not in private/incognito mode

**Theme not changing**
- Clear browser cache and try again
- Check that JavaScript is enabled

---

## Keyboard Shortcuts

- **Enter**: Send message (in input box)
- **Shift + Enter**: Add new line in message (in input box)
- **Escape**: Close dialogs

---

## Support and Feedback

For additional help or to report issues, contact your system administrator or IT support team.

---

*Last Updated: November 2025*
*Version: 1.0*
