# 🔑 API Key Setup Guide

Your horoscope website needs an Anthropic API key to generate AI-powered horoscopes.

## 📋 Quick Steps:

### 1. Get Your API Key (2 minutes)

1. Go to: **https://console.anthropic.com/**
2. Click **"Sign Up"** (or "Log In" if you have an account)
3. Complete the signup process
4. Navigate to **Settings** → **API Keys**
5. Click **"Create Key"**
6. Give it a name like "Horoscope Website"
7. **Copy the API key** (you won't see it again!)

💡 **Note:** Anthropic offers free credits for new accounts to get started!

---

### 2. Add API Key to Vercel (1 minute)

**During Initial Deployment:**
1. When importing your project to Vercel
2. Before clicking "Deploy", expand **"Environment Variables"**
3. Add:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** (paste your API key from step 1)
4. Click "Deploy"

**After Deployment (if you forgot):**
1. Go to your project in Vercel dashboard
2. Click **"Settings"** tab
3. Click **"Environment Variables"** in the sidebar
4. Click **"Add New"**
5. Enter:
   - **Key:** `ANTHROPIC_API_KEY`
   - **Value:** (paste your API key)
6. Click **"Save"**
7. Go to **"Deployments"** tab
8. Click the three dots on your latest deployment
9. Click **"Redeploy"**

---

### 3. Test Your Website

1. Visit your Vercel URL (e.g., `https://cosmic-horoscope.vercel.app`)
2. Click on any zodiac sign
3. You should see a generated horoscope! ✨

If you see "The cosmic energies are currently unavailable":
- Check that your API key is set correctly in Vercel
- Make sure you redeployed after adding the key
- Check the Vercel deployment logs for errors

---

## 💰 Pricing Info:

**Anthropic API Pricing:**
- New accounts get free credits to start
- After free credits: Pay-as-you-go pricing
- Each horoscope generation costs a few cents
- Perfect for personal projects and demos

For detailed pricing: https://www.anthropic.com/pricing

---

## 🔒 Security Notes:

✅ **DO:**
- Keep your API key secret
- Add it only in Vercel environment variables
- Never commit it to GitHub

❌ **DON'T:**
- Share your API key publicly
- Put it directly in your code
- Commit `.env` files to git (`.gitignore` prevents this)

---

## 🆘 Troubleshooting:

**"API key not configured" error:**
→ Make sure `ANTHROPIC_API_KEY` is set in Vercel environment variables

**"Invalid API key" error:**
→ Double-check you copied the entire key correctly

**Still not working:**
→ Check Vercel deployment logs: Project → Deployments → Click on deployment → "View Function Logs"

---

Your website is now fully powered by AI! 🌟
