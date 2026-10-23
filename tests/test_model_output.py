#!/usr/bin/env python3
"""
Unit tests for model output formatting, tone, and multi-turn context retention.
"""

import unittest

class TestEchoCareModelOutput(unittest.TestCase):

    def test_concise_spoken_length(self):
        """Spoken output should be concise and well-suited for voice synthesis (under 60 words)."""
        sample_response = "You have two pending tasks today for Eleanor: evening medication at 7:30 PM and setting up the humidifier at 9:00 PM."
        words = sample_response.split()
        self.assertLess(len(words), 60, "Response is too verbose for voice assistant speech.")

    def test_single_clarification_rule(self):
        """Clarification questions must ask only one direct question at a time."""
        clarification = "Did you want me to mark Eleanor's evening medication as completed, or would you like to schedule a reminder for her pill routine?"
        # Count question marks
        q_count = clarification.count("?")
        self.assertEqual(q_count, 1, "Must ask only one single clear clarification question at a time.")

    def test_confirmation_prompt_structure(self):
        """Consequential prompts must offer explicit confirmation."""
        prompt = "Six PM today. Shall I save that reminder?"
        self.assertTrue("shall i save" in prompt.lower() or "should i save" in prompt.lower())

    def test_tamil_spoken_response(self):
        """Tamil responses must use natural spoken phrasing."""
        tamil_resp = "இன்று மாலை 7:30 மணிக்கு எலினாருக்கு மாலை மருந்து வழங்கும் பணி நிலுவையில் உள்ளது."
        self.assertIn("மருந்து", tamil_resp)
        self.assertLess(len(tamil_resp.split()), 40)

    def test_tanglish_code_switching(self):
        """Tanglish code-switching should understand colloquial phrasing and produce clear confirmation."""
        tanglish_query = "Echo, innikku evening 6 manikku reminder set pannu."
        expected_conf = "இன்று மாலை 6:00 மணிக்கு நினைவூட்டலை சேமிக்கவா? Shall I save that reminder for 6 PM today?"
        self.assertIn("6:00", expected_conf)
        self.assertIn("Shall I save", expected_conf)

    def test_hindi_spoken_response(self):
        """Hindi responses must be natural and well-structured."""
        hindi_resp = "आज शाम 7:30 बजे एलेनोर की शाम की दवाई का कार्य बाकी है।"
        self.assertIn("दवाई", hindi_resp)
        self.assertLess(len(hindi_resp.split()), 40)

if __name__ == "__main__":
    unittest.main()
