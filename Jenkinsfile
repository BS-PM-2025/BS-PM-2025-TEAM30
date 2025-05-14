pipeline {
    agent any

    environment {
        BACKEND_DIR = 'backend'
        FRONTEND_DIR = 'frontend-clean'
        VENV_PATH = "${BACKEND_DIR}/venv"
    }

    options {
        skipDefaultCheckout(false)
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
                dir("${BACKEND_DIR}") {
                    sh '''
                        python -m venv venv
                        . venv/bin/activate
                        pip install --upgrade pip
                        pip install -r ../requirements.txt
                    '''
                }
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
                        . venv/bin/activate
                        python manage.py test --verbosity 2
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
