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
            - generic [ref=e14]:
              - generic [ref=e15]: Email Address
              - textbox "Email Address" [ref=e16]
            - generic [ref=e17]:
              - generic [ref=e18]: Password
              - textbox "Password" [ref=e19]
            - button "Sign In" [ref=e20] [cursor=pointer]
          - generic [ref=e21]:
            - paragraph [ref=e22]:
              - text: Don't have an account?
              - link "Sign up here" [ref=e23] [cursor=pointer]:
                - /url: /auth/signup
            - paragraph [ref=e24]:
              - link "Forgot your password?" [ref=e25] [cursor=pointer]:
                - /url: /auth/forgot-password
      - paragraph [ref=e27]: Protected by advanced security measures
  - region "Notifications alt+T"
  - generic [ref=e28]:
    - img [ref=e30]
    - button "Open Tanstack query devtools" [ref=e78] [cursor=pointer]:
      - img [ref=e79] [cursor=pointer]
  - alert [ref=e127]
```