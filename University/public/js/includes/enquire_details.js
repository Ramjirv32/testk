$(document).ready(function () {
  $('.countrySelect').select2({
            placeholder: "Select Country" 
        });

        $('.universitySelect').select2({
            placeholder: "Select University" 
        });

    toastr.options = {
        "closeButton": true,
        "debug": false,
        "newestOnTop": true,
        "progressBar": true,
        "positionClass": "toast-top-right",
        "preventDuplicates": true,
        "onclick": null,
        "showDuration": "300",
        "hideDuration": "1000",
        "timeOut": "5000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
    };
    $("#enquireForm").on("submit", function (e) {
        e.preventDefault();

        $.ajax({
            url: "/enquire-details/store",
            method: "POST",
            data: $(this).serialize(),
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
            },
            success: function (response) {
                $("#enquireForm")[0].reset();
                toastr.success('Survey created successfully!');
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.error("Submission failed:", textStatus, errorThrown);
            },
        });
    });

    $(document).on("click", "#delete_enquire_details", function (e) {
        e.preventDefault();
        var enquireDetailsId = $(this).data("delete-id");

        $.ajax({
            url: "/enquire-details/" + enquireDetailsId,
            method: "DELETE",
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
            },
        })
            .done(function (response) {
                toastr.success(response.message);
                window.location.reload();
            })
            .fail(function (xhr, status, error) {
                console.error("Error:", error);
                alert("Failed to delete enquiry details. Please try again.");
            });
    });
});
