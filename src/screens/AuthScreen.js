import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithCredential, signInAnonymously } from 'firebase/auth';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

// This ensures the web browser closes correctly after authentication.
WebBrowser.maybeCompleteAuthSession();

const AuthScreen = ({ showToast }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(true);

    const auth = getAuth();

    // --- IMPORTANT: Configure Client IDs for both platforms ---
    // You get these from your Google Cloud Console / Firebase Project
    const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
      iosClientId: 'YOUR_IOS_CLIENT_ID',
      androidClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
      // webClientId is used for Android, do not get confused by the name
    });

    // Handle the response from the Google authentication flow
    useEffect(() => {
        if (response?.type === 'success') {
            setLoading(true);
            const { id_token } = response.params;
            const credential = GoogleAuthProvider.credential(id_token);
            signInWithCredential(auth, credential)
              .then(() => {
                showToast('Signed in with Google!');
              })
              .catch(error => {
                handleAuthError(error);
              })
              .finally(() => {
                setLoading(false);
              });
        }
         else if (response?.type === 'error') {
            showToast('Login with Google was canceled.', 'ERROR');
        }
    }, [response]);


    const handleEmailAuthentication = async () => {
        if (email.trim() === '' || password.trim() === '') {
            showToast('Email and password cannot be empty.', 'ERROR');
            return;
        }
        setLoading(true);
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
                showToast('Welcome back!');
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
                showToast('Account created successfully!');
            }
        } catch (error) {
            handleAuthError(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAnonymousSignIn = async () => {
        setLoading(true);
        try {
            await signInAnonymously(auth);
            showToast('Continuing as a guest.');
        } catch (error) {
            handleAuthError(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAuthError = (error) => {
        let errorMessage = "An error occurred, please try again.";
        switch (error.code) {
            case 'auth/invalid-email':
                errorMessage = 'Please enter a valid email address.';
                break;
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                errorMessage = 'Invalid email or password, please try again.';
                break;
            case 'auth/email-already-in-use':
                errorMessage = 'This email is already registered. Please sign in or use another email.';
                break;
            case 'auth/weak-password':
                errorMessage = 'Password is too weak. It must be at least 6 characters long.';
                break;
            default:
                errorMessage = 'Authentication failed. Please check your network connection or credentials.';
                console.error("Authentication Error: ", error);
                break;
        }
        showToast(errorMessage, 'ERROR');
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <Text style={styles.title}>Shinning Start</Text>
            <Text style={styles.subtitle}>{isLogin ? 'Sign in to continue' : 'Create an account to get started'}</Text>

            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#ADB5BD"
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor="#ADB5BD"
            />

            {loading ? (
                <ActivityIndicator size="large" color="#212529" style={{ marginVertical: 20 }}/>
            ) : (
                <>
                    <TouchableOpacity style={styles.button} onPress={handleEmailAuthentication}>
                        <Text style={styles.buttonText}>{isLogin ? 'Sign In' : 'Sign Up'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.button, styles.googleButton]} 
                        disabled={!request}
                        onPress={() => {
                            promptAsync();
                        }}
                    >
                        <Text style={styles.buttonText}>Sign in with Google</Text>
                    </TouchableOpacity>
                </>
            )}

            <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.toggleButton}>
                <Text style={styles.toggleText}>
                    {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                </Text>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.divider} />
            </View>

             <TouchableOpacity onPress={handleAnonymousSignIn}>
                <Text style={styles.toggleText}>Continue as Guest</Text>
            </TouchableOpacity>

        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#F8F9FA',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#212529',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#6C757D',
        marginBottom: 40,
    },
    input: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#DEE2E6',
        borderRadius: 8,
        padding: 15,
        fontSize: 16,
        marginBottom: 16,
        backgroundColor: 'white',
        color: '#212529'
    },
    button: {
        width: '100%',
        backgroundColor: '#212529',
        borderRadius: 8,
        paddingVertical: 15,
        alignItems: 'center',
        marginTop: 10,
    },
    googleButton: {
        backgroundColor: '#4285F4',
        marginTop: 15,
    },
    buttonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },
    toggleButton: {
        marginTop: 20,
    },
    toggleText: {
        color: '#007BFF',
        fontSize: 14,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '80%',
        marginVertical: 30,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: '#DEE2E6',
    },
    dividerText: {
        width: 50,
        textAlign: 'center',
        color: '#6C757D'
    }
});

export default AuthScreen;
