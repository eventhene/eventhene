<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
  </head>
  <body>
    <template>
      <style>
        #root {
          position: absolute;
          inset: 0;
        }
        #fields {
          width: 860px;
          padding: 40px;
        }
        #fields .fh {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 26px;
          font-size: 19px;
          font-weight: 800;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--sky);
        }
        #fields .fh span.d {
          width: 11px;
          height: 11px;
          border-radius: 50%;
          background: var(--sky);
        }
        #fields .row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.05);
          padding: 22px 26px;
          font-size: 32px;
          font-weight: 600;
          color: var(--ink-2);
          opacity: 0;
        }
        #fields .row + .row {
          margin-top: 14px;
        }
        #fields .tag {
          font-size: 17px;
          font-weight: 800;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--muted);
        }
        #fields .req {
          color: var(--accent);
        }
      </style>

      <div id="root" data-composition-id="s3" data-width="1920" data-height="1080">
        <div class="w" id="s3-w">
          <div class="col">
            <h2 class="sec-h" id="s3-h">Collect exactly the fields you want.</h2>
            <div id="fields" class="card">
              <p class="fh"><span class="d"></span>Registration form</p>
              <div class="row" id="fr1"><span>Full name</span><span class="tag req">Required</span></div>
              <div class="row" id="fr2"><span>Phone number</span><span class="tag req">Required</span></div>
              <div class="row" id="fr3"><span>Email</span><span class="tag req">Required</span></div>
              <div class="row" id="fr4"><span>City</span><span class="tag">Optional</span></div>
            </div>
          </div>
        </div>
      </div>

      <script>
        (function () {
          var tl = gsap.timeline({ paused: true });
          var E = "power3.out";
          tl.to("#s3-w", { opacity: 1, duration: 0.3, ease: "power2.inOut" }, 0.2);
          tl.fromTo("#s3-h", { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.45, ease: E }, 0.56);
          // beat-grid: rows at 13.11s, 13.64s, 14.20s, 14.73s global (slot starts at 11.46s)
          var ids = ["#fr1", "#fr2", "#fr3", "#fr4"];
          var at = [1.65, 2.18, 2.74, 3.27];
          for (var i = 0; i < ids.length; i++) {
            tl.fromTo(ids[i], { opacity: 0, x: -26 }, { opacity: 1, x: 0, duration: 0.35, ease: E }, at[i]);
          }
          tl.to("#s3-w", { opacity: 0, duration: 0.3, ease: "power2.inOut" }, 6.56);
          window.__timelines["s3"] = tl;
        })();
      </script>
    </template>
  </body>
</html>
