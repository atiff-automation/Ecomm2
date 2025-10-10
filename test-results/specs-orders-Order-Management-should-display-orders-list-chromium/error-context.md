# Page snapshot

```yaml
- generic [active]:
  - alert [ref=e1]
  - dialog "Server Error" [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - navigation [ref=e8]:
          - button "previous" [disabled] [ref=e9]:
            - img "previous" [ref=e10]
          - button "next" [disabled] [ref=e12]:
            - img "next" [ref=e13]
          - generic [ref=e15]:
            - generic [ref=e16]: "1"
            - text: of
            - generic [ref=e17]: "1"
            - text: error
          - generic [ref=e18]:
            - generic "An outdated version detected (latest is 15.5.4), upgrade is highly recommended!" [ref=e20]: Next.js (14.2.31) is outdated
            - link "(learn more)" [ref=e21] [cursor=pointer]:
              - /url: https://nextjs.org/docs/messages/version-staleness
        - heading "Server Error" [level=1] [ref=e22]
        - paragraph [ref=e23]: "Error: ENOENT: no such file or directory, open '/Users/atiffriduan/Desktop/EcomJRM/.next/server/edge-instrumentation.js'"
        - generic [ref=e25]: This error happened while generating the page. Any console logs will be displayed in the terminal window.
      - generic [ref=e26]:
        - heading "Call Stack" [level=2] [ref=e27]
        - generic [ref=e28]:
          - heading "readFileSync" [level=3] [ref=e29]
          - generic [ref=e31]: node:fs (441:20)
        - group [ref=e32]:
          - generic "Next.js" [ref=e33] [cursor=pointer]:
            - img [ref=e34] [cursor=pointer]
            - img [ref=e36] [cursor=pointer]
            - text: Next.js
```