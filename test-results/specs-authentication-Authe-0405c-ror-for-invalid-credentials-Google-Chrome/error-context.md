# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e4]:
      - generic [ref=e5]:
        - heading "JRM E-commerce" [level=1] [ref=e6]
        - paragraph [ref=e7]: Malaysian E-commerce with Membership Benefits
      - generic [ref=e8]:
        - generic [ref=e9]:
          - generic [ref=e10]: Sign In to Your Account
          - generic [ref=e11]: Enter your email and password to access your account
        - generic [ref=e12]:
          - generic [ref=e13]:
            - generic [ref=e14]: Invalid email or password
            - generic [ref=e15]:
              - generic [ref=e16]: Email Address
              - textbox "Email Address" [ref=e17]: invalid@example.com
            - generic [ref=e18]:
              - generic [ref=e19]: Password
              - textbox "Password" [ref=e20]: wrongpassword
            - button "Sign In" [ref=e21] [cursor=pointer]
          - generic [ref=e22]:
            - paragraph [ref=e23]:
              - text: Don't have an account?
              - link "Sign up here" [ref=e24] [cursor=pointer]:
                - /url: /auth/signup
            - paragraph [ref=e25]:
              - link "Forgot your password?" [ref=e26] [cursor=pointer]:
                - /url: /auth/forgot-password
      - paragraph [ref=e28]: Protected by advanced security measures
  - region "Notifications alt+T"
  - generic [ref=e29]:
    - img [ref=e31]
    - button "Open Tanstack query devtools" [ref=e79] [cursor=pointer]:
      - img [ref=e80] [cursor=pointer]
  - alert [ref=e128]
```