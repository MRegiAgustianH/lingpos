<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Struk Pembayaran - {{ $transaction->invoice_number }}</title>
    <style>
        body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            color: #000;
            margin: 0;
            padding: 0;
            background-color: #f0f0f0;
        }
        .receipt {
            width: 58mm; /* Width suitable for 58mm thermal printers */
            margin: 20px auto;
            padding: 10px;
            background-color: #fff;
            box-shadow: 0 0 5px rgba(0,0,0,0.1);
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .font-bold { font-weight: bold; }
        .mt-2 { margin-top: 10px; }
        .mb-2 { margin-bottom: 10px; }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        table td {
            vertical-align: top;
            padding: 2px 0;
        }
        .border-top { border-top: 1px dashed #000; }
        .border-bottom { border-bottom: 1px dashed #000; }
        @media print {
            body { margin: 0; background-color: #fff; }
            .receipt { 
                width: 100%; /* For printing, take full width of defined paper size */
                margin: 0; 
                padding: 5px; 
                box-shadow: none; 
            }
        }
    </style>
</head>
<body onload="window.print()">
    <div class="receipt">
        <div class="text-center font-bold mb-2">
            <span style="font-size: 16px;">{{ $transaction->branch->name ?? 'LingPOS' }}</span><br>
            <span style="font-size: 10px;">{{ $transaction->branch->address ?? '' }}</span>
            @if($transaction->branch?->phone)
            <br><span style="font-size: 10px;">Telp: {{ $transaction->branch->phone }}</span>
            @endif
        </div>
        
        <div class="border-bottom mb-2"></div>
        
        <table style="font-size: 11px;">
            <tr>
                <td style="width: 35%;">No</td>
                <td>: {{ $transaction->invoice_number }}</td>
            </tr>
            <tr>
                <td>Tgl</td>
                <td>: {{ $transaction->created_at->format('d/m/Y H:i') }}</td>
            </tr>
            <tr>
                <td>Kasir</td>
                <td>: {{ $transaction->user->name ?? 'Unknown' }}</td>
            </tr>
        </table>
        
        <div class="border-bottom mt-2 mb-2"></div>
        
        <table style="font-size: 11px;">
            @foreach($transaction->transactionItems as $item)
            <tr>
                <td colspan="3">{{ $item->menu_name }}</td>
            </tr>
            <tr>
                <td class="text-left" style="padding-left: 10px; width: 40%;">{{ $item->quantity }} x</td>
                <td class="text-left" style="width: 30%;">{{ number_format($item->price, 0, ',', '.') }}</td>
                <td class="text-right" style="width: 30%;">{{ number_format($item->subtotal, 0, ',', '.') }}</td>
            </tr>
            @endforeach
        </table>
        
        <div class="border-top mt-2 mb-2"></div>
        
        <table style="font-size: 12px;" class="font-bold">
            <tr>
                <td style="width: 50%;">Total</td>
                <td class="text-right">Rp {{ number_format($transaction->total, 0, ',', '.') }}</td>
            </tr>
            <tr>
                <td>Bayar ({{ ucfirst($transaction->payment_method) }})</td>
                <td class="text-right">Rp {{ number_format($transaction->amount_paid, 0, ',', '.') }}</td>
            </tr>
            <tr>
                <td>Kembali</td>
                <td class="text-right">Rp {{ number_format($transaction->change, 0, ',', '.') }}</td>
            </tr>
        </table>
        
        <div class="border-bottom mt-2 mb-2"></div>
        
        <div class="text-center" style="font-size: 10px; margin-top: 10px;">
            Terima Kasih Atas Kunjungan Anda<br>
            Powered by LingPOS
        </div>
    </div>
</body>
</html>
