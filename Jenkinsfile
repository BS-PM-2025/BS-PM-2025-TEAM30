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
                       python manage.py migrate
                       python manage.py test  --verbosity 2

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
