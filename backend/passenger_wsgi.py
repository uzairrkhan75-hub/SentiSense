"""WSGI entry point for Hostinger's Passenger-based Python App hosting.

Hostinger's shared/business hosting runs Python apps through Phusion
Passenger, which imports this file and looks for an `application` callable
-- unlike run.py, which is only used for local development.
"""
from app import create_app

application = create_app()
