pipeline {
    agent any

    environment {
        VENV_PATH = 'venv'
        FRONTEND_DIR = 'frontend-clean'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Backend') {
            agent {
                docker {
                    image 'python:3.12'
                }
            }
            steps {
                sh '''
                    python -m venv ${VENV_PATH}
                    . ${VENV_PATH}/bin/activate
                    pip install --upgrade pip
                    pip install -r requirements.txt
                '''
            }
        }
stage('Test Backend') {
    agent {
        docker {
            image 'python:3.12'
        }
    }
    steps {
        sh '''
            . ${VENV_PATH}/bin/activate

            # Create a temporary test settings file that uses SQLite
            echo "from backend.settings import *

# Use SQLite for testing instead of PostgreSQL
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}" > test_settings.py

            echo "Running migrations for Django apps..."
            python manage.py migrate --settings=test_settings

            echo "Running tests with SQLite in-memory database..."
            python manage.py test --settings=test_settings --verbosity 2
        '''
    }
}

        stage('Install Frontend') {
            agent {
                docker {
                    image 'node:20'
                }
            }
            steps {
                dir("${FRONTEND_DIR}") {
                    sh 'npm install'
                }
            }
        }

        stage('Test Frontend') {
            agent {
                docker {
                    image 'node:20'
                }
            }
            steps {
                dir("${FRONTEND_DIR}") {
                    sh 'npm test -- --watchAll=false'
                }
            }
        }
    }
}
