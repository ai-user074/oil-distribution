from setuptools import setup
import os

app_path = os.path.dirname(os.path.abspath(__file__))

setup(
	name="oil_distribution",
	version="0.0.1",
	description="Oil Distribution and Intercompany Operations",
	author="Admin",
	author_email="admin@example.com",
	packages=["oil_distribution"],
	zip_safe=False,
	include_package_data=True,
)
