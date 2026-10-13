<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Verify your email</title>
</head>

<body style="
    margin: 0;
    padding: 0;
    background-color: #17111F;
    font-family: Arial, Helvetica, sans-serif;
    color: #ffffff;
">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #17111F;">
    <tr>
        <td align="center" style="padding: 40px 20px;">

            <!-- Main container -->
            <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                    max-width: 600px;
                    background-color: #211A2B;
                    border: 1px solid #3a3048;
                    border-radius: 16px;
                    overflow: hidden;
                "
            >

                <!-- Brand header -->
                <tr>
                    <td style="padding: 32px 36px 24px; text-align: center;">

                        <div style="
                            font-size: 26px;
                            font-weight: bold;
                            letter-spacing: -0.5px;
                            color: #ffffff;
                        ">
                            LGBTQIA <span style="color: #E83E8C;">Community</span>
                        </div>

                        <div style="
                            width: 80px;
                            height: 3px;
                            margin: 18px auto 0;
                            background: linear-gradient(
                                90deg,
                                #E83E8C,
                                #7C3AED,
                                #2563EB
                            );
                        "></div>

                    </td>
                </tr>

                <!-- Content -->
                <tr>
                    <td style="padding: 20px 36px 40px;">

                        <h1 style="
                            margin: 0 0 18px;
                            font-size: 28px;
                            line-height: 1.3;
                            text-align: center;
                            color: #ffffff;
                        ">
                            Welcome, <strong>{{ ($user->username) }}</strong>!
                        </h1>

                        <p style="
                            margin: 0 0 18px;
                            font-size: 16px;
                            line-height: 1.7;
                            color: #d8d1df;
                        ">
                            Thanks for joining LGBTQIA Community.
                            We're glad you're here.
                        </p>

                        <p style="
                            margin: 0 0 28px;
                            font-size: 16px;
                            line-height: 1.7;
                            color: #d8d1df;
                        ">
                            Before you can continue, please verify your
                            email address to confirm that this account belongs
                            to you.
                        </p>

                        <!-- CTA -->
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                <td align="center">

                                    <a
                                        href="{{ $url }}"
                                        style="
                                            display: inline-block;
                                            padding: 14px 30px;
                                            background-color: #E83E8C;
                                            color: #ffffff;
                                            text-decoration: none;
                                            font-size: 15px;
                                            font-weight: bold;
                                            border-radius: 8px;
                                        "
                                    >
                                        Verify My Email
                                    </a>

                                </td>
                            </tr>
                        </table>

                        <!-- Divider -->
                        <div style="
                            height: 1px;
                            background-color: #3a3048;
                            margin: 32px 0;
                        "></div>

                        <p style="
                            margin: 0 0 12px;
                            font-size: 13px;
                            line-height: 1.6;
                            color: #a9a0b2;
                        ">
                            If the button above doesn't work, copy and paste
                            the following link into your browser:
                        </p>

                        <p style="
                            margin: 0;
                            font-size: 12px;
                            line-height: 1.6;
                            word-break: break-all;
                        ">
                            <a
                                href="{{ $url }}"
                                style="
                                    color: #8b7cf6;
                                    text-decoration: none;
                                "
                            >
                                {{ $url }}
                            </a>
                        </p>

                        <p style="
                            margin: 28px 0 0;
                            font-size: 13px;
                            line-height: 1.6;
                            color: #8f8797;
                        ">
                            If you didn't create an account on LGBTQIA Community,
                            you can safely ignore this email.
                        </p>

                    </td>
                </tr>

                <!-- Footer -->
                <tr>
                    <td style="
                        padding: 22px 36px;
                        background-color: #19131f;
                        border-top: 1px solid #332a40;
                        text-align: center;
                    ">

                        <p style="
                            margin: 0 0 8px;
                            font-size: 12px;
                            color: #8f8797;
                        ">
                            LGBTQIA Community
                        </p>

                        <p style="
                            margin: 0;
                            font-size: 11px;
                            color: #68606f;
                        ">
                            A space to connect, share, and feel at home.
                        </p>

                    </td>
                </tr>

            </table>

            <!-- Outside footer -->
            <p style="
                max-width: 500px;
                margin: 20px auto 0;
                font-size: 11px;
                line-height: 1.5;
                text-align: center;
                color: #68606f;
            ">
                This is an automated message. Please do not reply to this email.
            </p>

        </td>
    </tr>
</table>

</body>
</html>