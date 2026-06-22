from setuptools import setup, find_packages

setup(
    name="flowml-cli",
    version="0.1.0",
    description="Production-grade ML pipeline automation CLI",
    long_description=open("../README.md").read(),
    long_description_content_type="text/markdown",
    author="Nityanand Pujari",
    author_email="nitaipujari@gmail.com",
    url="https://github.com/Nitaiz123/flowml",
    packages=find_packages(),
    python_requires=">=3.9",
    install_requires=[
        "click>=8.1.0",
        "pyyaml>=6.0",
        "rich>=13.0.0",
    ],
    extras_require={
        "full": [
            "kubernetes>=28.0.0",
            "docker>=6.0.0",
            "evidently>=0.4.0",
            "prometheus-client>=0.17.0",
        ]
    },
    entry_points={
        "console_scripts": [
            "flowml=flowml.main:main",
        ],
    },
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "Intended Audience :: Science/Research",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
    keywords="mlops machine-learning pipeline kubernetes docker deployment",
)
