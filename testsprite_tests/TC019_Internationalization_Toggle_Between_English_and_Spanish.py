import pytest
from playwright.sync_api import Page, expect

def test_language_toggle(page: Page):
    print("Navigating to home page...")
    page.goto("http://localhost:3000/")
    
    # Wait for content
    page.wait_for_selector("h1")

    # --- English Check ---
    print("Checking English content...")
    expect(page.locator("h1")).to_contain_text("Your Vision, Printed.")
    expect(page.get_by_role("button", name="Get Started")).to_be_visible()

    # --- Switch to Spanish ---
    print("Switching to Spanish...")
    globe_icon = page.locator("svg.lucide-globe").first
    lang_btn = globe_icon.locator("..")
    lang_btn.click()
    page.get_by_text("Español").click()
    
    # Wait for re-render
    page.wait_for_timeout(1000)

    # --- Spanish Check ---
    print("Checking Spanish content...")
    
    # Check Hero Title and Subtitle
    expect(page.get_by_role("heading", name="Tu Visión, Impresa.")).to_be_visible()
    expect(page.get_by_text("Impresión personalizada de alta calidad para todas tus necesidades. Desde prendas hasta gran formato, hacemos realidad tus ideas.")).to_be_visible()
    
    print("Language toggle test passed!")
