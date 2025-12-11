# backend/helpcentre/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.conf import settings
from django.utils.module_loading import import_string
import logging

logger = logging.getLogger(__name__)

try:
    import google.generativeai as genai
except ImportError:
    genai = None
    logger.warning(
        "google.generativeai is not installed. Help Centre bot will run in fallback mode."
    )


class HelpCentreChatView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        question = request.data.get("question", "")
        if not question:
            return Response({"error": "Question is required"}, status=400)

        q_lower = question.lower()

        # Restrict topics – now also allows password/account/login questions
        allowed_keywords = [
            "talentlink", "hire", "freelancer", "client", "project",
            "support", "help", "issue", "problem", "complaint", "contact",
            "service", "hi", "hello", "account", "notification", "portfolio",
            "jobs", "job", "workspace", "contract", "proposal",
            "password", "reset", "login", "signin", "sign in", "sign up",
        ]

        if not any(w in q_lower for w in allowed_keywords):
            return Response(
                {"answer": "Sorry, I can only answer TalentLink-related questions."}
            )

        # If the Gemini library is missing, stay graceful
        if genai is None:
            logger.error("google.generativeai not available, using fallback answer.")
            return Response(
                {
                    "answer": (
                        "⚠️ The Help Centre bot's AI engine is currently unavailable. "
                        "You can still use the Contact Us page for detailed support."
                    )
                }
            )

        # Get API key safely
        api_key = getattr(settings, "GEMINI_API_KEY", None)
        if not api_key:
            logger.error("GEMINI_API_KEY is not configured in settings.")
            return Response(
                {
                    "answer": (
                        "⚠️ The Help Centre bot is temporarily unavailable "
                        "due to a configuration issue. Please use the Contact Us page "
                        "or try again later."
                    )
                }
            )

        context_prompt = """
You are the TalentLink Help Centre AI Support Bot.
Respond only to questions related to TalentLink features, hiring, freelancers, client work, projects, accounts, passwords, and payments.

Below are examples of frequently asked questions and their style of answers:

Q: hi?
A: Hello! How can I assist you with TalentLink today?

Q: How do I reset my TalentLink password?
A: To reset your password:
1. Go to the Sign In page on TalentLink.
2. Click on "Forgot your password?".
3. Enter the email address linked to your account.
4. Open the reset link sent to your email.
5. Choose a new password and confirm it, then save.

Q: I need support / I need help immediately.
A: Please describe your difficulty. You can also visit the Contact Us page to get assistance from our support team.

Q: Can someone call me about my issue?
A: Sure. Please explain your difficulty and fill out the form on the Contact Us page. A support representative will connect with you shortly.

Q: Where can I submit a complaint?
A: You can submit complaints through the Contact Us page. Please explain your difficulty there and our team will address it quickly.

Q: I have an issue that is not listed here. What should I do?
A: Please type your difficulty and also reach out through the Contact Us page so our customer support personnel can help you directly.

Q: I can't solve my issue even after trying the steps.
A: No problem. Please describe your difficulty and visit the Contact Us page so our support team can assist you personally.

Q: How do I talk to customer service?
A: Simply share your difficulty in short, and our customer support personnel will assist you through the Contact Us page.

Q: Can I get personalised support?
A: Yes. Please share your difficulty and submit your details in the Contact Us page. Our team will respond as soon as possible.

Always give short, step-by-step and helpful answers.
If a question is not related to TalentLink, reply: "Sorry, I can only answer TalentLink-related questions."
"""

        try:
            # Configure Gemini
            genai.configure(api_key=api_key)

            # You can change the model name if needed, but keep it consistent
            model = genai.GenerativeModel("models/gemini-2.5-flash")

            # Prefer passing as separate parts (recommended by SDK)
            response = model.generate_content(
                [context_prompt, f"User: {question}"]
            )

            # Safely extract text
            answer_text = getattr(response, "text", None)
            if not answer_text:
                logger.warning("Gemini returned no text. Using generic fallback answer.")
                answer_text = (
                    "Sorry, I couldn't generate an answer right now. "
                    "Please try again in a few minutes or contact support through the Contact Us page."
                )

            return Response({"answer": answer_text})

        except Exception as e:
            # Log full traceback on the backend, but keep a safe message for the user
            logger.exception("Error in HelpCentreChatView while calling Gemini API: %s", e)

            fallback = (
                "⚠️ I'm having trouble connecting to the Help Centre AI engine right now. "
                "Please try again after some time or use the Contact Us page for direct assistance."
            )

            # IMPORTANT: return 200 so frontend doesn't see a hard error
            return Response(
                {
                    "answer": fallback,
                    # Optional: expose technical detail only when DEBUG is True
                    "detail": str(e) if getattr(settings, "DEBUG", False) else "",
                }
            )
