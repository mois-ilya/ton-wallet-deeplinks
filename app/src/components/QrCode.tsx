import { QRCodeSVG } from 'qrcode.react';

type Props = {
  value: string;
};

export default function QrCode(props: Props) {
  return <QRCodeSVG value={props.value} size={192} includeMargin />;
}

