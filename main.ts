Deno.serve({ port: 3000 }, async (req) => {
    const url = new URL(req.url)
    if (url.pathname == "/") {
        return new Response(
            `<h1>hack club auth scope demo</h1><p>this is a demo site for hack club auth to show how easy it is to request only a few scopes at first then add sensitive things like address or real name later on</p><p>choose some scopes here and press the button to authorize them, after signing in notice how the id stays the same, possibly allowing adding more information to a database row.</p>${["openid", "email", "name", "profile", "verification_status", "slack_id"].map((x) => `<input type="checkbox" id="scope-${x}" /><label for="scope-${x}">${x}</label>`).join("")}<button onclick="location.href=\`https://auth.hackclub.com/oauth/authorize?client_id=${Deno.env.get("HCA_CLIENT_ID")}&redirect_uri=$\{location.origin}%2Fauth%2Fcallback&response_type=code&scope=$\{[...document.querySelectorAll('[id^=scope]')].map(x=>x.checked?x.id.slice(6):'').join('+')}\`">sign in!</button><p>note: i do not store or log any of this data, but there's probably some way for me to get it. i don't plan to check who's logged into this ever</p>`, // i was feeling one-liner-y today
            { headers: { "content-type": "text/html" } },
        )
    }
    if (url.pathname == "/auth/callback") {
        try {
            const code = url.searchParams.get("code")
            const response = await fetch(
                "https://auth.hackclub.com/oauth/token",
                {
                    method: "POST",
                    body: JSON.stringify({
                        client_id: Deno.env.get("HCA_CLIENT_ID"),
                        client_secret: Deno.env.get("HCA_CLIENT_SECRET"),
                        redirect_uri: Deno.env.get("HCA_REDIRECT_URL")
                            ? Deno.env.get("HCA_REDIRECT_URL")
                            : url.origin + url.pathname,
                        code,
                        grant_type: "authorization_code",
                    }),
                    headers: { "content-type": "application/json" },
                },
            )
            const json = await response.json()
            if (json.error) {
                return new Response(
                    "error: " + json.error + "\n" + json.error_description,
                    { status: 401 },
                )
            }
            const meResponse = await fetch(
                "https://auth.hackclub.com/api/v1/me",
                {
                    headers: { authorization: "Bearer " + json.access_token },
                },
            )
            const meJson = await meResponse.json()
            if (meJson.error) {
                return new Response("error: " + meJson.error, { status: 401 })
            }
            return new Response(
                "success! scopes: " +
                    json.scope +
                    "\ndata:\n" +
                    JSON.stringify(meJson),
            )
        } catch (err) {
            console.error(err)
            return new Response(null, { status: 500 })
        }
    }
    return new Response(null, { status: 404 })
})
