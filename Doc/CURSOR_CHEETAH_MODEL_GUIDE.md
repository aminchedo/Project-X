# 🐆 CURSOR CHEETAH MODEL GUIDE
## How to Use Claude 3.5 Sonnet (Cheetah) in Cursor AI

**Last Updated:** January 6, 2025  
**Cursor Version:** Latest  
**Model:** Claude 3.5 Sonnet (Cheetah - Extended Context)

---

## 🎯 OVERVIEW

The Cheetah model is Cursor's name for **Claude 3.5 Sonnet with extended context window**. It's one of the most powerful AI models available in Cursor, offering superior code understanding and generation capabilities.

### Key Features
- **Extended Context:** Up to 200K tokens (vs 8K for GPT-4)
- **Code Understanding:** Excellent at analyzing large codebases
- **Multi-file Editing:** Can work across multiple files simultaneously
- **Advanced Reasoning:** Better at complex problem-solving
- **Long Conversations:** Maintains context across longer interactions

---

## 🚀 HOW TO ENABLE CHEETAH MODEL

### Method 1: Using Cursor Settings (Recommended)

1. **Open Cursor Settings**
   - Windows/Linux: `Ctrl + ,`
   - Mac: `Cmd + ,`
   - Or: Click Settings icon (⚙️) in bottom-left corner

2. **Navigate to AI Models**
   - Go to `Cursor Settings` → `Models` → `Chat Model`
   - Or search for "model" in settings search bar

3. **Select Cheetah Model**
   - Find "Claude 3.5 Sonnet" in the dropdown
   - Select it as your default chat model
   - The extended context version is labeled as "Claude 3.5 Sonnet (200K)"

4. **Apply Settings**
   - Click "Save" or "Apply"
   - Restart Cursor if needed

### Method 2: Using Cursor Chat Interface

1. **Open Chat Panel**
   - Press `Ctrl + L` (Windows/Linux) or `Cmd + L` (Mac)
   - Or click the Chat icon in the left sidebar

2. **Select Model from Chat**
   - Look for model selector at the top of chat panel
   - Click on current model name (usually shows "GPT-4" or similar)
   - Select "Claude 3.5 Sonnet" from dropdown

3. **Start Using**
   - Type your question or request
   - Cheetah will respond with extended context awareness

### Method 3: Using Keyboard Shortcut

1. **Open Command Palette**
   - Press `Ctrl + Shift + P` (Windows/Linux) or `Cmd + Shift + P` (Mac)

2. **Search for Model Settings**
   - Type "Cursor: Select Model"
   - Press Enter

3. **Choose Claude 3.5 Sonnet**
   - Select from the list
   - Confirm selection

---

## 💡 USING CHEETAH MODEL EFFECTIVELY

### Best Practices

#### 1. Provide Context
```
Instead of: "Fix this bug"

Better: "In the ProfessionalDashboard.tsx file, the market data 
is not updating in real-time. The WebSocket connection is 
established but the updateMarketDataFromWS function isn't 
being called. Can you help debug this?"
```

#### 2. Reference Multiple Files
```
"I need to integrate the RealApiService from 
src/services/RealApiService.ts with the DataManager in 
src/services/DataManager.ts. Please update both files to 
work together seamlessly."
```

#### 3. Ask for Comprehensive Solutions
```
"Scan the entire src/components directory and identify all 
unused components. Then create a cleanup plan with specific 
file paths and import updates needed."
```

#### 4. Use for Architectural Decisions
```
"Based on the current project structure, what's the best way 
to implement real-time whale tracking? Consider the existing 
WebSocket service, DataManager, and component structure."
```

### Advanced Features

#### 1. Multi-File Editing
```
"Update the following files to add TypeScript strict mode:
1. src/services/binanceApi.ts
2. src/services/tradingEngine.ts
3. src/components/ProfessionalDashboard.tsx

Ensure all type definitions are correct and fix any errors."
```

#### 2. Codebase Analysis
```
"Analyze the entire backend/ directory and create a 
dependency graph showing which modules import from which. 
Identify any circular dependencies."
```

#### 3. Refactoring Assistance
```
"Refactor the PredictiveAnalyticsDashboard.tsx component to:
1. Split into smaller components
2. Improve performance with useMemo
3. Add proper TypeScript types
4. Implement error boundaries"
```

#### 4. Documentation Generation
```
"Generate comprehensive documentation for all API endpoints 
in the backend/api/ directory, including request/response 
formats, authentication requirements, and example usage."
```

---

## 🎨 CURSOR-SPECIFIC FEATURES WITH CHEETAH

### 1. Chat Mode (Ctrl + L / Cmd + L)
Best for:
- Asking questions about your code
- Getting explanations
- Planning features
- Debugging issues

**Example Usage:**
```
You: "How does the real-time market data flow work in this project?"

Cheetah: [Analyzes WebSocket service, DataManager, and components 
to provide comprehensive explanation]
```

### 2. Composer Mode (Ctrl + I / Cmd + I)
Best for:
- Multi-file edits
- Large refactoring tasks
- Creating new features
- Project-wide changes

**Example Usage:**
```
You: "Add authentication to all API routes and update the 
frontend to handle auth tokens"

Cheetah: [Modifies multiple backend and frontend files simultaneously]
```

### 3. Inline Edit Mode (Ctrl + K / Cmd + K)
Best for:
- Quick edits in current file
- Single-function modifications
- Code improvements

**Example Usage:**
```
You: [Select a function] "Optimize this function for performance"

Cheetah: [Suggests optimized version with explanations]
```

### 4. Context-Aware Suggestions
Cheetah automatically:
- Understands your entire codebase
- Suggests relevant completions
- Maintains style consistency
- References related files

---

## 🔥 POWER USER TIPS

### 1. Use @ Mentions
```
@file src/components/ProfessionalDashboard.tsx 
"Explain the component lifecycle"

@folder src/services 
"List all API services and their purposes"

@code [select code] 
"Refactor this to use hooks instead of class components"
```

### 2. Provide File Paths
```
"Update src/services/RealApiService.ts to add a new endpoint 
for fetching historical whale data"
```

### 3. Use for Code Reviews
```
"Review the changes in src/components/WhaleTracker.tsx and 
suggest improvements for:
- Performance
- Error handling
- TypeScript types
- Code organization"
```

### 4. Ask for Alternatives
```
"Show me 3 different ways to implement real-time updates 
in the RealTimeRiskMonitor component, with pros and cons 
for each approach"
```

### 5. Debug Complex Issues
```
"The WebSocket connection keeps disconnecting after 30 seconds. 
Here's the relevant code:
- src/services/EnhancedWebSocket.ts
- src/services/DataManager.ts
- src/components/ProfessionalDashboard.tsx

Help me debug this issue."
```

---

## 📊 CHEETAH VS OTHER MODELS

| Feature | Cheetah (Claude 3.5) | GPT-4 | GPT-3.5 |
|---------|---------------------|-------|---------|
| **Context Window** | 200K tokens | 8K tokens | 4K tokens |
| **Code Understanding** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Multi-file Editing** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **Response Speed** | Fast | Medium | Very Fast |
| **Cost** | Higher | Medium | Lower |
| **Best For** | Large codebases | General coding | Quick questions |

### When to Use Each Model

**Cheetah (Claude 3.5 Sonnet)**
- ✅ Large codebase analysis
- ✅ Multi-file refactoring
- ✅ Complex architectural decisions
- ✅ Comprehensive documentation
- ✅ Deep debugging

**GPT-4**
- ✅ General programming tasks
- ✅ Quick code generation
- ✅ Standard debugging
- ✅ Single-file edits

**GPT-3.5**
- ✅ Simple questions
- ✅ Code formatting
- ✅ Quick fixes
- ✅ Documentation writing

---

## 🛠️ TROUBLESHOOTING

### Issue: Cheetah Model Not Available

**Solution 1: Update Cursor**
```bash
# Check for updates
Help → Check for Updates
# Or download latest from https://cursor.sh
```

**Solution 2: Check Subscription**
- Cheetah may require Cursor Pro subscription
- Go to Settings → Account → Subscription
- Upgrade if needed

**Solution 3: Clear Cache**
```bash
# Close Cursor
# Delete cache folder:
# Windows: %APPDATA%\Cursor\Cache
# Mac: ~/Library/Application Support/Cursor/Cache
# Linux: ~/.config/Cursor/Cache
# Restart Cursor
```

### Issue: Responses Are Too Slow

**Solution:**
- Use GPT-4 for quick questions
- Reserve Cheetah for complex tasks
- Enable "Fast Mode" in settings
- Check internet connection

### Issue: Context Not Being Used

**Solution:**
- Explicitly mention files: `@file path/to/file`
- Use `@folder` for directory context
- Open relevant files in editor
- Use Composer mode for multi-file tasks

### Issue: Model Switching Doesn't Work

**Solution:**
- Restart Cursor completely
- Clear workspace cache
- Check settings are saved
- Try command palette method

---

## 💰 PRICING & LIMITS

### Cursor Pro Subscription
- **Price:** ~$20/month (check latest pricing)
- **Includes:** Unlimited Cheetah requests (fair use)
- **Features:** All AI models, priority support

### Free Tier Limitations
- Limited requests per day
- May not have access to Cheetah
- Slower response times
- Basic features only

### Usage Tips to Stay Within Limits
1. Use GPT-3.5 for simple questions
2. Batch related questions together
3. Use Cheetah for complex tasks only
4. Clear chat history when starting new topics
5. Use @mentions to reduce context size

---

## 📚 EXAMPLE WORKFLOWS

### Workflow 1: Feature Development
```
1. Plan with Cheetah:
   "I want to add a whale alert notification system. 
   What files need to be modified?"

2. Generate code:
   "Create the WhaleAlertService in src/services/"

3. Integrate:
   "Update DataManager to use WhaleAlertService"

4. Test:
   "Add unit tests for WhaleAlertService"

5. Document:
   "Generate documentation for the new feature"
```

### Workflow 2: Debugging
```
1. Describe issue:
   "WebSocket disconnects randomly, here's the error log..."

2. Analyze code:
   "@file src/services/EnhancedWebSocket.ts 
   What could cause disconnections?"

3. Get solution:
   "Provide a fix with error handling and reconnection logic"

4. Test fix:
   "How can I test the reconnection logic?"
```

### Workflow 3: Refactoring
```
1. Identify issues:
   "@folder src/components 
   Which components need performance optimization?"

2. Plan refactoring:
   "Create a refactoring plan for these components"

3. Execute:
   "Refactor PredictiveAnalyticsDashboard.tsx first"

4. Verify:
   "What tests should I run to verify the refactoring?"
```

---

## 🎓 LEARNING RESOURCES

### Official Documentation
- **Cursor Docs:** https://docs.cursor.sh
- **Claude 3.5 Guide:** https://www.anthropic.com/claude
- **Cursor Discord:** Join for community support

### Video Tutorials
- Search YouTube: "Cursor AI Claude 3.5 tutorial"
- Cursor official channel tutorials
- Community guides and tips

### Community Resources
- Cursor Discord server
- Reddit: r/cursor
- Twitter: @cursor_ai

---

## 🚀 QUICK START CHECKLIST

- [ ] Update Cursor to latest version
- [ ] Verify Cursor Pro subscription (if needed)
- [ ] Open Settings (Ctrl/Cmd + ,)
- [ ] Navigate to Models section
- [ ] Select "Claude 3.5 Sonnet (200K)"
- [ ] Save settings and restart
- [ ] Open Chat (Ctrl/Cmd + L)
- [ ] Verify model is "Claude 3.5 Sonnet"
- [ ] Test with a simple question
- [ ] Try multi-file editing with Composer

---

## 💡 PRO TIPS FOR THIS PROJECT

### 1. Analyze Project Structure
```
"Analyze the entire BoltAiCrypto project structure and 
create a component dependency graph. Identify:
- Core components and their dependencies
- Unused components
- Potential circular dependencies
- Optimization opportunities"
```

### 2. Improve Performance
```
"Review all React components in src/components/ and 
suggest performance optimizations:
- Memoization opportunities
- Lazy loading candidates
- Bundle splitting recommendations
- React best practices violations"
```

### 3. Enhance Type Safety
```
"Add strict TypeScript types to all files in 
src/services/ and src/components/. Fix any type errors 
and improve type definitions for better IDE support."
```

### 4. Generate Documentation
```
"Create comprehensive API documentation for all 
backend endpoints, including:
- Request/response formats
- Authentication requirements
- Example requests
- Error codes and handling"
```

---

**Happy Coding with Cheetah! 🐆**

For questions or issues, refer to the Troubleshooting section or visit the Cursor Discord community.
